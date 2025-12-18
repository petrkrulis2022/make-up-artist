import React, { useState, useEffect } from "react";
import { fetchCategories } from "../services/portfolioService";
import ImageGallery from "../components/ImageGallery";
import "./AboutPage.css";

function AboutPage() {
  const [aboutCategory, setAboutCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAboutCategory = async () => {
      try {
        setLoading(true);
        const categoriesData = await fetchCategories("o-mne");
        if (categoriesData.length > 0) {
          setAboutCategory(categoriesData[0]);
        }
      } catch (err) {
        console.error("Error loading about category:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAboutCategory();
  }, []);

  return (
    <div className="about-page">
      <div className="about-page__container">
        <h1 className="about-page__title">O mně</h1>
        <div className="about-page__content">
          <p className="about-page__text">
            Jmenuji se Hanka a jsem profesionální vizážistka s více než 8 lety
            zkušeností v oboru. Moje cesta ke kráse začala studiem kosmetiky a
            vizážistiky na prestižní akademii, kde jsem získala solidní základ
            pro svou kariéru.
          </p>
          <p className="about-page__text">
            Specializuji se především na svatební líčení, kde je mým cílem
            vytvořit dokonalý vzhled, který vydrží celý den a bude krásně
            vypadat na fotografiích i v reálném životě. Pracuji s nevěstami po
            celé České republice a miluji být součástí jejich nejdůležitějšího
            dne.
          </p>
          <p className="about-page__text">
            Kromě svateb se věnuji také líčení na plesy, večírky, slavnostní
            příležitosti a profesionálnímu líčení pro focení. Každá klientka je
            pro mě jedinečná a přistupuji k ní individuálně, abych zdůraznila
            její přirozenou krásu a osobnost.
          </p>
          <p className="about-page__text">
            Moje filozofie je jednoduchá: líčení by mělo zvýraznit to nejlepší v
            každé ženě, ne to zakrýt. Pracuji s prémiové kosmetikou renomovaných
            značek a neustále se vzdělávám v nejnovějších trendech a technikách.
            Mým cílem je, aby se každá moje klientka cítila sebevědomě, krásně a
            jedinečně.
          </p>
          <p className="about-page__text">
            Těším se, že vás budu moci přivítat ve svém studiu a společně
            vytvoříme váš dokonalý vzhled pro vaši speciální příležitost.
          </p>
        </div>

        {!loading && aboutCategory && (
          <div className="about-page__gallery">
            <ImageGallery categoryId={aboutCategory.id} />
          </div>
        )}
      </div>
    </div>
  );
}

export default AboutPage;
