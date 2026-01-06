import s from "./footer.module.css";

export function Footer() {
    return (
        <div className={s.m}>
            <div className={s.text}>
              <div>Нужна помощь?</div>
              <div className={s.secText}>
                Ознакомьтесь с документацией или свяжитесь с поддержкой
              </div>
            </div>

            <div className={s.buttons}>
                <button className={s.button}>Документация</button>
                <button className={s.button}>Связаться с поддержкой</button>
            </div>
        </div>
    );
}