import styles from './page.module.css';
import { AppGeneralProps } from './app-props';

export const Status = (props: AppGeneralProps) => {
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
