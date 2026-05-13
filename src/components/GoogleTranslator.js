import React, { memo } from 'react';

const GoogleTranslator = memo(({ id = 'google_translate_element' }) => {
    React.useEffect(() => {
        const initTranslate = () => {
            if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                const element = document.getElementById(id);
                if (element && element.innerHTML.trim() === "") {
                    try {
                        new window.google.translate.TranslateElement({
                            pageLanguage: 'es', 
                            includedLanguages: 'en,es,fr,de,it,pt',
                            autoDisplay: false,
                            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
                        }, id);
                        console.log(`📡 TRADUCTOR (${id}): Sistema inicializado.`);
                    } catch (e) {
                        console.error(`❌ TRADUCTOR (${id}): Error ->`, e);
                    }
                }
            }
        };

        const timer = setTimeout(initTranslate, 1500);
        const interval = setInterval(() => {
            const el = document.getElementById(id);
            if (el && el.innerHTML.trim() === "") {
                initTranslate();
            }
        }, 3000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [id]);

    return <div id={id} className="google-translate-container"></div>;
});

export default GoogleTranslator;
