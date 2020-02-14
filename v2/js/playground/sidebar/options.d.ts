import { PluginFactory } from '..';
/** Whether the playground should actively reach out to an existing plugin */
export declare const allowConnectingToLocalhost: () => boolean;
export declare const activePlugins: () => {
    module: string;
}[];
export declare const optionsPlugin: PluginFactory;
