import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './forms.css';

const Forms = ({ title, subtitle, children, onSubmit, onClear, btnText }) => {
    const { t } = useLanguage();

    const handleClear = () => {
        if (onClear) {
            onClear();
        }
    };

    return (
        <div className="forms-overlay fade-in">
            <div className="forms-container" role="dialog" aria-labelledby="form-title">
                <h2 id="form-title" className="forms-title">{title ? title.toUpperCase() : t('submit')}</h2>
                {subtitle && <p className="forms-subtitle">{subtitle}</p>}

                <form onSubmit={onSubmit} encType="multipart/form-data" className="responsive-form">
                    <div className="forms-content">
                        {children}
                    </div>

                    <div className="forms-actions">
                        <button type="submit" className="forms-btn-submit" aria-label={btnText || t('submit')}>
                            {btnText || t('submit')}
                        </button>

                        <div className="forms-row">
                            <button
                                type="button"
                                className="forms-btn-clear"
                                onClick={handleClear}
                                aria-label={t('cancel')}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                type="button"
                                className="forms-btn-home"
                                onClick={() => window.location.href = '/'}
                                aria-label={t('home')}
                            >
                                {t('home')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Forms;