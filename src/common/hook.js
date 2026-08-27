import Hook from '@libs/hook';


const MESSAGE = {
    ERROR: 'message.error',
    SUCCESS: 'message.success',
    CLOSE: 'message.close'
};

const LANGUAGE = {
    LOADED: 'language.loaded'
};

const FILE = {
    PREVIEWED: 'file.previewed'
}

export const EVENTS = {
    MESSAGE,
    LANGUAGE,
    FILE,
    LEFT_NAV_COLLAPSED: 'left_nav_collapsed',
    NEED_TO_UPGRADE: 'need_to_upgrade'
};

const HOOK = new Hook();
export {
    HOOK
};