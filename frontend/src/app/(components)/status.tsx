import styles from './page.module.css';
import { FractalParams } from './page';

export const Status = (props: FractalParams) => {
    const { isRendering, curPoint } = props;

    const renderStyle = isRendering.value ? styles.isRendering : styles.notRendering;

    return (
        <div className={styles.status}>
            <label>{curPoint.value}&nbsp;</label>
            <div className={styles.frameRate}>
                {isRendering.value && <label>Rendering...</label>}
                <div className={renderStyle} />
            </div>
        </div>
    );
}
