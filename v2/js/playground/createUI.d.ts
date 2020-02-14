export interface UI {
    showModal: (message: string, subtitle?: string, buttons?: any) => void;
    flashInfo: (message: string) => void;
}
export declare const createUI: () => UI;
