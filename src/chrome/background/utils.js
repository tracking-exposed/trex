import db from '../db';
const bo = chrome || browser;


bo.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'chromeConfig') {
        bo.cookies.get({
            url: 'https://www.youtube.com/',
            name: 'VISITOR_INFO1_LIVE'
        }, cookie => {
            const userId = cookie ? cookie.value : "local";
            db
                .get('/settings')
                .then(settings => {
                    sendResponse({
                        userId: userId,

                        // Expose only what we need
                        settings: settings ? {
                            lessInfo: settings.lessInfo,
                            tagId: settings.tagId,
                            isStudyGroup: settings.isStudyGroup
                        } : {
                            lessInfo: false,
                            tagId: null,
                            isStudyGroup: false
                        },

                        logo16: bo.extension.getURL('yttrex16.png'),
                        logo48: bo.extension.getURL('yttrex48.png'),
                        logo128: bo.extension.getURL('yttrex128.png')
                    });
                });
        });
        return true;
    }
});
