declare namespace IAppConfig {
    interface Shortcuts {
        translate: string;
        rotate: string;
        scale: string;
        undo: string;
        focus: string;
        roamToggle: string;
    }

    interface Camera {
        navigationMode: "orbit" | "roam";
        roamMoveSpeed: number;
    }

    interface Config {
        theme: 'os' | 'dark' | 'light';
        mainColor: string;
        history: boolean;
        shortcuts: Shortcuts;
        roamingCharacter: string;
        camera: Camera;
    }
}