import styles from './page.module.css';
import { ChangeEvent, MouseEvent, useCallback, useEffect, useRef } from 'react';
import { FractalParams } from './page';
import { isValidFormula, wasmMemoryUsage } from '../(wasm-wrapper)/util';
import { classNames, useEventListener } from '../(util)/util';
import { transformIdent } from '../(util)/transform';
import { useValue } from '../(util)/valued';
import { usePeriodicFn } from '../(util)/periodic-fn';
import { ColorScheme } from '../(render)/data';
import { randomCycle2, randomFormula } from './random-formulas';

enum SettingsPanel {
    RENDERING = "Rendering",
    DEBUG = "Debug",
    INFO = "Info",
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
                        : <InfoSettings />
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

    const onFocus = useCallback(() => {
        isCustomFormula.value = !defaultPolynomials.includes(formula.value);
        if (!customRef.current || !dropdownRef.current || !document.activeElement) return;
        isCustomFormula.value ||= (document.activeElement == customRef.current);
    }, [isCustomFormula, formula.value]);
    useEffect(() => { onFocus(); }, [onFocus, formula.value]);

    useEventListener('keydown', onKeyDown as EventListener, <Element,>() => { return window as unknown as Element });

    const onClickRandomCycle2 = () => { formula.value = randomCycle2(); reRender(); }
    const onClickRandomFormula = () => { formula.value = randomFormula(); reRender(); }

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
            <button
                className={styles.randomFormula}
                onClick={onClickRandomCycle2} >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <g fill="none" stroke="black" strokeWidth="1" strokeLinejoin="round">
                        <polygon fill="none" strokeWidth="15" points="0,0 100,0 100,100 0,100" />
                        <g className={styles.randomCycle2Circles}>
                            <circle fill="black" cx="25" cy="25" r="10" />
                            <circle fill="black" cx="75" cy="75" r="10" />
                        </g>
                    </g>
                </svg>
            </button>
            <button
                className={styles.randomFormula}
                onClick={onClickRandomFormula} >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <g fill="none" stroke="black" strokeWidth="1" strokeLinejoin="round">
                        <polygon fill="none" strokeWidth="15" points="0,0 100,0 100,100 0,100" />
                        <circle fill="black" cx="50" cy="50" r="10" />
                        <circle fill="black" cx="25" cy="25" r="10" />
                        <circle fill="black" cx="75" cy="25" r="10" />
                        <circle fill="black" cx="25" cy="75" r="10" />
                        <circle fill="black" cx="75" cy="75" r="10" />
                    </g>
                </svg>
            </button>
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

const InfoSettings = () => {

    const overviewHref = "https://github.com/quilan1/newton-fractals-wasm#detailed-overview"

    return (
        <div className={styles.infoSettings}>
            <h1>Newton&apos;s Method Sandbox</h1>
            <p>
                Use the <span>Formula</span> dropdown to select a pre-made function for rendering. Alternatively,
                one may use the <span>Custom</span> input for entering their own functions.
            </p>
            <p>
                The <span>mouse wheel</span> may be used to zoom in/out and the mouse may reposition by <span>click-dragging</span> the
                image. The pre-selected functions may be switched between by pressing the <span>left</span> or <span>right</span> keyboard
                arrow.
            </p>
            <p>
                For more detailed usage information, as well as other resources, consult
                the <a href={overviewHref} target="_blank">README.md</a>.
            </p>
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
    '-8*z^6 - 9*z^4 + 1*z^3 - 107*z^2 + 117*z - 321',
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
    '7z^5 + 5z^4 - 2z^2 - 41z + 41', // c2?: [-1, 1], [7, 5, 0, -2]
    '9z^5 + 6z^4 - 9z^3 + 27z^2 - 36z + 123', // c2a: [-1, 1], [9, 6, -9]
    '3z^5 + z^4 - 9z^3 - 8z^2 + 18z - 17', //c2: [-1, 1], [3, 1, -9, -8]
    '2z^5 + 4z^4 - 3z^3 - 6z^2 - 3z + 10', //c2: [-1, 1], [2, 4, -3, -6]
    '-6z^5 - 13z^4 + 3z^3 + 31z - 58', // A 4-cycle!?! Awesome!
    '6z^6 + 8z^5 - z^4 - 23z + 54', // Extraordinarily chaotic around z=0... not sure if there's a cycle length

    'z^6 - 4z^4 + 4z^2 - 4',
    'z^6 - 4z^4 + 6z^2 + 3',
    'z^6 - 4z^4 + 6z^2 + 4',
];
