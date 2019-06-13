/********************************************************************************
 * Copyright (C) 2017 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { inject, injectable, named, postConstruct } from 'inversify';
import { ILogger } from '@theia/core/lib/common';
import { FrontendApplication, ApplicationShell } from '@theia/core/lib/browser';
import { TaskResolverRegistry, TaskProviderRegistry } from './task-contribution';
import { TERMINAL_WIDGET_FACTORY_ID, TerminalWidgetFactoryOptions } from '@theia/terminal/lib/browser/terminal-widget-impl';
import { TerminalWidget } from '@theia/terminal/lib/browser/base/terminal-widget';
import { WidgetManager } from '@theia/core/lib/browser/widget-manager';
import { MessageService } from '@theia/core/lib/common/message-service';
import { TaskServer, TaskInfo, TaskConfiguration } from '../common/task-protocol';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { VariableResolverService } from '@theia/variable-resolver/lib/browser';
import { TaskWatcher } from '../common/task-watcher';
import { TaskConfigurationClient, TaskConfigurations } from './task-configurations';
import { IProcessExitEvent } from '@theia/process/lib/node/process';
import URI from '@theia/core/lib/common/uri';

import { WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { MessageConnection } from 'vscode-jsonrpc';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { tasksPath } from '../common/task-protocol';
import { DisposableCollection } from '@theia/core';

@injectable()
export class TaskService implements TaskConfigurationClient {
    /**
     * Reflects whether a valid task configuration file was found
     * in the current workspace, and is being watched for changes.
     */
    protected configurationFileFound: boolean = false;

    @inject(FrontendApplication)
    protected readonly app: FrontendApplication;

    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;

    @inject(TaskServer)
    protected readonly taskServer: TaskServer;

    @inject(ILogger) @named('task')
    protected readonly logger: ILogger;

    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;

    @inject(TaskWatcher)
    protected readonly taskWatcher: TaskWatcher;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(TaskConfigurations)
    protected readonly taskConfigurations: TaskConfigurations;

    @inject(VariableResolverService)
    protected readonly variableResolverService: VariableResolverService;

    @inject(TaskResolverRegistry)
    protected readonly taskResolverRegistry: TaskResolverRegistry;

    @inject(TaskProviderRegistry)
    protected readonly taskProviderRegistry: TaskProviderRegistry;

    @inject(WebSocketConnectionProvider)
    protected readonly webSocketConnectionProvider: WebSocketConnectionProvider;

    protected readonly toDispose = new DisposableCollection();

    @postConstruct()
    protected init(): void {
        this.workspaceService.onWorkspaceChanged(async roots => {
            this.configurationFileFound = (await Promise.all(roots.map(r => this.taskConfigurations.watchConfigurationFile(r.uri)))).some(result => !!result);
            const rootUris = roots.map(r => new URI(r.uri));
            const taskConfigFileUris = this.taskConfigurations.configFileUris.map(strUri => new URI(strUri));
            for (const taskConfigUri of taskConfigFileUris) {
                if (!rootUris.some(rootUri => !!rootUri.relative(taskConfigUri))) {
                    this.taskConfigurations.unwatchConfigurationFile(taskConfigUri.toString());
                    this.taskConfigurations.removeTasks(taskConfigUri.toString());
                }
            }
        });

        // notify user that task has started
        this.taskWatcher.onTaskCreated((event: TaskInfo) => {
            if (this.isEventForThisClient(event.ctx)) {
                const task = event.config;
                // const provider = this.taskProviderRegistry.getProvider(task.source);
                // if (!provider || !provider.attach) {
                //     const taskIdentifier =
                //         task
                //             ? ContributedTaskConfiguration.is(task)
                //                 ? `${task._source}: ${task.label}`
                //                 : `${task.type}: ${task.label}`
                //             : `${event.taskId}`;
                //     this.messageService.info(`Task ${taskIdentifier} has been started`);
                // }
            }
        });

        // notify user that task has finished
        // this.taskWatcher.onTaskExit((event: TaskExitedEvent) => {
        //     if (!this.isEventForThisClient(event.ctx)) {
        //         return;
        //     }

        //     const taskConfiguration = event.config;
        //     const provider = this.taskProviderRegistry.getProvider(taskConfiguration.source);
        //     if (!provider || !provider.attach) {
        //         const taskIdentifier =
        //             taskConfiguration
        //                 ? ContributedTaskConfiguration.is(taskConfiguration)
        //                     ? `${taskConfiguration._source}: ${taskConfiguration.label}`
        //                     : `${taskConfiguration.type}: ${taskConfiguration.label}`
        //                 : `${event.taskId}`;

        //         if (event.code !== undefined) {
        //             const message = `Task ${taskIdentifier} has exited with code ${event.code}.`;
        //             if (event.code === 0) {
        //                 this.messageService.info(message);
        //             } else {
        //                 console.error('Invalid TaskExitedEvent received, neither code nor signal is set.');
        //             }
        //         } else if (event.signal !== undefined) {
        //             this.messageService.info(`Task ${taskIdentifier} was terminated by signal ${event.signal}.`);
        //         } else {
        //             console.error('Invalid TaskExitedEvent received, neither code nor signal is set.');
        //         }
        //     }
        // });
    }

    /** Returns an array of the task configurations configured in tasks.json and provided by the extensions. */
    async getTasks(): Promise<TaskConfiguration[]> {
        const configuredTasks = this.taskConfigurations.getTasks();
        const providedTasks = await this.getProvidedTasks();
        return [...configuredTasks, ...providedTasks];
    }

    /** Returns an array of the task configurations which are provided by the extensions. */
    async getProvidedTasks(): Promise<TaskConfiguration[]> {
        const providedTasks: TaskConfiguration[] = [];
        const providers = this.taskProviderRegistry.getProviders();
        for (const provider of providers) {
            providedTasks.push(...await provider.provideTasks());
        }
        return providedTasks;
    }

    /**
     * Returns a task configuration provided by an extension by task source and label.
     * If there are no task configuration, returns undefined.
     */
    async getProvidedTask(source: string, label: string): Promise<TaskConfiguration | undefined> {
        const provider = this.taskProviderRegistry.getProvider(source);
        if (provider) {
            const tasks = await provider.provideTasks();
            return tasks.find(t => t.label === label);
        }
        return undefined;
    }

    /** Returns an array of running tasks 'TaskInfo' objects */
    getRunningTasks(): Promise<TaskInfo[]> {
        return this.taskServer.getTasks(this.getContext());
    }

    /**
     * Runs a task, by task configuration label.
     * Note, it looks for a task configured in tasks.json only.
     */
    async runConfiguredTask(source: string, taskLabel: string): Promise<void> {
        const task = this.taskConfigurations.getTask(source, taskLabel);
        if (!task) {
            this.logger.error(`Can't get task launch configuration for label: ${taskLabel}`);
            return;
        }
        this.run(task.source, task.label);
    }

    /**
     * Runs a task, by the source and label of the task configuration.
     * It looks for configured and provided tasks.
     */
    async run(source: string, taskLabel: string): Promise<void> {
        let task = await this.getProvidedTask(source, taskLabel);
        if (!task) {
            task = this.taskConfigurations.getTask(source, taskLabel);
            if (!task) {
                this.logger.error(`Can't get task launch configuration for label: ${taskLabel}`);
                return;
            }
        }

        const resolver = this.taskResolverRegistry.getResolver(task.type);
        let resolvedTask: TaskConfiguration;
        try {
            resolvedTask = resolver ? await resolver.resolveTask(task) : task;
        } catch (error) {
            this.logger.error(`Error resolving task '${taskLabel}': ${error}`);
            this.messageService.error(`Error resolving task '${taskLabel}': ${error}`);
            return;
        }

        let taskInfo: TaskInfo;
        try {
            taskInfo = await this.taskServer.run(resolvedTask, this.getContext());
        } catch (error) {
            this.logger.error(`Error launching task '${taskLabel}': ${error}`);
            this.messageService.error(`Error launching task '${taskLabel}': ${error}`);
            return;
        }

        this.logger.debug(`Task created. Task id: ${taskInfo.taskId}`);

        // open terminal widget if the task is based on a terminal process (type: shell)
        // or attach to process output processor if a raw process (type: process)
        if (taskInfo.terminalId !== undefined) {
            if (taskInfo.config.type === 'shell') {
                this.attach(taskInfo.terminalId, taskInfo.taskId);
            } else {
                this.attachProcess(taskInfo);
            }
        }
    }

    protected waitForConnection: Deferred<MessageConnection> | undefined;

    protected async attachProcess(taskInfo: TaskInfo): Promise<void> {
        const { processId, config } = taskInfo;
        const { source } = config;

        const provider = this.taskProviderRegistry.getProvider(source);
        if (provider && provider.attach) {
            const waitForConnection = this.waitForConnection = new Deferred<MessageConnection>();

            const doKill = async () => {
                const connection = await waitForConnection.promise;
                connection.sendRequest('kill');
            };

            const lineProcessor = await provider.attach(taskInfo, doKill);

            this.webSocketConnectionProvider.listen({
                path: `${tasksPath}/${processId}`,
                onConnection: connection => {
                    connection.onNotification('onLine', (data: string) => lineProcessor.processLine(data));
                    connection.onNotification('onStart', () => lineProcessor.notifyStart(taskInfo.taskId, taskInfo.config));
                    connection.onNotification('onExit', (event: IProcessExitEvent) => lineProcessor.notifyExit(
                        {
                            taskId: taskInfo.taskId,
                            config: taskInfo.config,
                            ctx: taskInfo.ctx,
                            ...event
                        }
                    ));
                    connection.onDispose(() => lineProcessor.close());

                    this.toDispose.push(connection);
                    connection.listen();
                    if (waitForConnection) {
                        waitForConnection.resolve(connection);
                    }
                }
            }, { reconnecting: false });
        } else {
            this.logger.error(`TaskProvider implementation missing for ${source}.`);
        }
    }

    async attach(terminalId: number, taskId: number): Promise<void> {
        // create terminal widget to display an execution output of a Task that was launched as a command inside a shell
        const widget = <TerminalWidget>await this.widgetManager.getOrCreateWidget(
            TERMINAL_WIDGET_FACTORY_ID,
            <TerminalWidgetFactoryOptions>{
                created: new Date().toString(),
                id: 'task-' + taskId,
                caption: `Task #${taskId}`,
                label: `Task #${taskId}`,
                destroyTermOnClose: true
            }
        );
        this.shell.addWidget(widget, { area: 'bottom' });
        this.shell.activateWidget(widget.id);
        widget.start(terminalId);
    }

    protected isEventForThisClient(context: string | undefined): boolean {
        if (context === this.getContext()) {
            return true;
        }
        return false;
    }

    taskConfigurationChanged(event: string[]) {
        // do nothing for now
    }

    protected getContext(): string | undefined {
        return this.workspaceService.workspace && this.workspaceService.workspace.uri;
    }

    /** Kill task for a given id if task is found */
    async kill(id: number): Promise<void> {
        try {
            await this.taskServer.kill(id);
        } catch (error) {
            this.logger.error(`Error killing task '${id}': ${error}`);
            this.messageService.error(`Error killing task '${id}': ${error}`);
            return;
        }
        this.logger.debug(`Task killed. Task id: ${id}`);
    }
}
