import styles from './page.module.css';
import { ChangeEvent, MouseEvent, useRef } from 'react';
import { FractalParams } from './page';
import { isValidFormula, wasmMemoryUsage } from '../(wasm-wrapper)/util';
import { classNames, useEventListener } from '../(util)/util';
import { transformIdent } from '../(util)/transform';
import { useValue } from '../(util)/valued';
import { usePeriodicFn } from '../(util)/periodic-fn';
import { ColorScheme } from '../(render)/data';

enum SettingsPanel {
    RENDERING = "Rendering",
    DEBUG = "Debug",
    HELP = "Help",
}

export const Settings = (props: FractalParams) => {
    const settingsPanel = useValue(SettingsPanel.RENDERING);

    const onChangeSettingsPanel = (panel: SettingsPanel) => (_e: MouseEvent<HTMLDivElement>) => { settingsPanel.value = panel; };
    const headerStyle = (panel: SettingsPanel) => classNames(styles, ['settingsHeader', (settingsPanel.value == panel) ? 'selectedPanel' : '']);

    return (
        <div className={styles.settingsContainer}>
            <div className={styles.settingsHeaderContainer}>
                {Object.entries(SettingsPanel).map(([k, v]) => {
                    return <div key={k} className={headerStyle(v)} onClick={onChangeSettingsPanel(v)}>{v}</div>
                })}
            </div>
            <div className={styles.settings}>
                {settingsPanel.value == SettingsPanel.RENDERING
                    ? <RenderSettings {...props} />
                    : settingsPanel.value == SettingsPanel.DEBUG
                        ? <DebugSettings {...props} />
                        : <></>
                }
            </div>
        </div>
    );
}

///////////////////////////////////////////////////////////////////

const RenderSettings = (props: FractalParams) => {
    return (
        <div className={styles.renderSettingsContainer}>
            <FormulaSettings {...props} />
            <hr className={styles.settingsDivider} />
            <RenderPassSettings {...props} />
        </div>
    )
}

///////////////////////////////////////////////////////////////////

const FormulaSettings = (props: FractalParams) => {
    const { formula } = props;
    const dropdownRef = useRef<HTMLSelectElement>(null);
    const customRef = useRef<HTMLInputElement>(null);
    const isCustomFormula = useValue(false);

    const reRender = () => {
        const { transform, render, curPoint } = props;
        curPoint.value = "";
        transform.current = transformIdent();
        render();
    }

    const onChangeFormula = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { formula } = props;
        formula.value = e.target.value;
        reRender();
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (!dropdownRef.current) return;
        if (document.activeElement && document.activeElement != document.body) return;

        const index = defaultPolynomials.indexOf(dropdownRef.current.value);
        if (index < 0) return;

        let nextIndex: number;
        if (e.key == 'ArrowLeft') {
            e.preventDefault();
            if (index == 0) return;
            nextIndex = index - 1;
        } else if (e.key == 'ArrowRight') {
            e.preventDefault();
            nextIndex = index + 1;
            if (index == defaultPolynomials.length - 1) return;
        } else {
            return;
        }

        formula.value = defaultPolynomials[nextIndex];
        dropdownRef.current.selectedIndex = nextIndex;
        reRender();
    }

    const onFocus = () => {
        isCustomFormula.value = !defaultPolynomials.includes(formula.value);
        if (!customRef.current || !dropdownRef.current || !document.activeElement) return;
        isCustomFormula.value ||= (document.activeElement == customRef.current);
    }

    useEventListener('keydown', onKeyDown as EventListener, <Element,>() => { return window as unknown as Element });

    const _isValidFormula = isValidFormula(formula.value);
    const formulaDropdownStyle = classNames(styles, [
        'formulaDropdown',
        isCustomFormula.value ? 'isCustomFormula' : ''
    ]);
    const formulaStyle = classNames(styles, [
        'customFormula',
        !_isValidFormula ? 'badFormula' : '',
        isCustomFormula.value ? 'isCustomFormula' : ''
    ]);

    return (
        <div className={styles.formulaSettings}>
            <label>Formula:</label>
            <select
                className={formulaDropdownStyle}
                value={formula.value}
                onChange={onChangeFormula}
                onFocus={onFocus}
                onBlur={onFocus}
                ref={dropdownRef}>
                {defaultPolynomials.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <label>Custom:</label>
            <input
                className={formulaStyle}
                type="text"
                value={formula.value}
                onChange={onChangeFormula}
                onFocus={onFocus}
                onBlur={onFocus}
                ref={customRef}
            />
        </div>
    );
}

///////////////////////////////////////////////////////////////////

const RenderPassSettings = (props: FractalParams) => {
    const { renderSettings: { colorScheme, hueOffset, chromaticity, dropoff, renderRoots, staticHues }, recolor } = props;

    const onChangeScheme = (e: ChangeEvent<HTMLSelectElement>) => { colorScheme.value = e.target.value as ColorScheme; recolor(); }
    const onChangeHueOffset = (e: ChangeEvent<HTMLInputElement>) => { hueOffset.value = Number.parseFloat(e.target.value); recolor(); }
    const onChangeChromaticity = (e: ChangeEvent<HTMLInputElement>) => { chromaticity.value = Number.parseFloat(e.target.value); recolor(); }
    const onChangeDropoff = (e: ChangeEvent<HTMLInputElement>) => { dropoff.value = Number.parseFloat(e.target.value); recolor(); }
    const onChangeDrawRoots = (e: ChangeEvent<HTMLInputElement>) => { renderRoots.value = e.target.checked; recolor(); }
    const onChangeStaticHues = (e: ChangeEvent<HTMLInputElement>) => { staticHues.value = e.target.checked; recolor(); }

    return (
        <div className={styles.renderPassSettings}>
            <label>Color Scheme:</label>
            <select className={styles.colorScheme} onChange={onChangeScheme} value={props.renderSettings.colorScheme.value}>
                {Object.entries(ColorScheme).map(([k, v]) => <option key={k} value={v}>{v}</option>)}
            </select>
            <label>Hue Offset:</label>
            <input type="range" min="0" max="360" step="1" value={props.renderSettings.hueOffset.value} onChange={onChangeHueOffset} />
            <label>Chromaticity:</label>
            <input type="range" min="0" max="1" step="0.05" value={props.renderSettings.chromaticity.value} onChange={onChangeChromaticity} />
            <label>Shading Curve:</label>
            <input type="range" min="0" max="1" step="0.05" value={dropoff.value} onChange={onChangeDropoff} />
            <label>Show Roots:</label>
            <input type="checkbox" checked={renderRoots.value} onChange={onChangeDrawRoots} />
            <label>Static Hues:</label>
            <input type="checkbox" checked={staticHues.value} onChange={onChangeStaticHues} />
        </div>
    )
}

///////////////////////////////////////////////////////////////////

const DebugSettings = (_props: FractalParams) => {
    const memoryUsage = useValue("");
    usePeriodicFn(100, () => {
        const memoryUsageBytes = wasmMemoryUsage();
        if (!memoryUsageBytes) return;
        memoryUsage.value = (memoryUsageBytes / 1000000).toFixed(2);
    });

    return (
        <div className={styles.debugSettings}>
            <label>WASM Memory usage: {memoryUsage.value} MB</label>
        </div>
    )
}

///////////////////////////////////////////////////////////////////

export const defaultPolynomials = [
    // a=1, b=-13.8     z^5 + a*z^3 + b*z^2 - 5*a*z - 9*z + 3*b
    '5z^5 + 5z^3 - 69z^2 - 70z - 207',

    'z^13 - 3z^6 + z - 1',
    'z^5 + 3z^3 + z + 3',
    '2z^11 - 2z^7 + 4z^6 + 4z^5 - 4z^4 - 3z - 2',
    '-2z^10 + 3z^8 + z^6 + z^4 + 4z^2 + 5z + 5',
    'z^10 + z^8 - 2z^2 + 1',
    '-3z^10 - 4z^4 + z^2 - 2z - 3',
    '-2z^6 - 3z^3 - z + 6',
    '-z^9 + 4z^5 - 4z + 1',
    'z^7 - 4z^2 + 2z - 3',
    'z^4 - 3z^2 - 4',
    'z^4 - 3z^2 + 3',
    'z^4 + 3z^2 + 3',

    '3z^5 - 10z^3 + 23z',
    'z^4 - 6z^2 - 11',
    'z^4 + 6z^2 - 11',
    '-z^4 + 6z^2 - 10',
    '-z^4 - 6z^2 - 10',

    'z^3 - 2z + 2',

    '2z^4 + z^3 + 4z + 4',
    'z^4 + 3z + 3',
    'z^4 - 4z^3 - 9z + 27',

    'z^6 - 4z^4 + 4z^2 - 4',
    'z^6 - 4z^4 + 6z^2 + 3',
    'z^6 - 4z^4 + 6z^2 + 4',
];
