import React from "react";
import "./CoursesPage.css";

function CoursesPage() {
  return (
    <div className="courses-page">
      <div className="courses-page__container">
        <h1 className="courses-page__title">Kurzy líčení</h1>
        <div className="courses-page__content">
          <p className="courses-page__description">
            Nabízím profesionální kurzy líčení pro všechny, kteří se chtějí
            naučit umění make-upu. Kurzy jsou dostupné jak pro jednotlivce, tak
            pro skupiny, a jsou přizpůsobeny vašim potřebám a úrovni dovedností.
          </p>
          <p className="courses-page__description">
            Během kurzů se naučíte základní i pokročilé techniky líčení, včetně
            přípravy pleti, aplikace make-upu, konturování, zvýraznění rysů a
            vytváření různých stylů líčení pro různé příležitosti. Pracujeme s
            profesionálními produkty a nástroji.
          </p>
          <p className="courses-page__description">
            Kurzy probíhají v příjemném prostředí mého studia a jsou vedeny
            individuálně nebo ve skupinkách do 4 osob. Délka a obsah kurzu se
            přizpůsobí vašim požadavkům.
          </p>
          <p className="courses-page__contact">
            Pro více informací o kurzech, termínech a cenách mě prosím
            kontaktujte přes kontaktní formulář nebo na emailu{" "}
            <a href="mailto:info@glowbyhanka.cz">info@glowbyhanka.cz</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CoursesPage;
