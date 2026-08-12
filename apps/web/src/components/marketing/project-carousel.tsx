"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const slides = [
  {
    src: "/images/home/mayotte-tropical-project.jpg",
    alt: "Projet architectural tropical contemporain face au lagon mahorais",
    eyebrow: "Architecture tropicale",
    title: "Equipement public bioclimatique",
    description: "Protections solaires, circulations couvertes et materiaux adaptes au climat insulaire.",
  },
  {
    src: "/images/home/architecture-plans.jpg",
    alt: "Table de travail avec plans, coupes, maquette et materiaux d'architecture",
    eyebrow: "Conception",
    title: "Du plan au dossier technique",
    description: "Plans, coupes et choix de materiaux reunis avant le passage en phase chantier.",
  },
  {
    src: "/images/home/mayotte-construction-site.jpg",
    alt: "Chantier tropical organise sur une colline avec vue vers le lagon",
    eyebrow: "Suivi de chantier",
    title: "Construire avec le site",
    description: "Une execution lisible, documentee et attentive au relief comme au paysage local.",
  },
] as const;

export function ProjectCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % slides.length);
  }

  return (
    <section className="overflow-hidden rounded-[2rem] bg-stone-950 shadow-[0_28px_80px_rgba(61,47,35,0.18)]" aria-roledescription="carousel" aria-label="Projets et architecture a Mayotte">
      <div className="grid lg:grid-cols-[1.45fr_0.55fr]">
        <div className="relative aspect-[16/10] min-h-72 overflow-hidden lg:aspect-auto lg:min-h-[34rem]">
          <Image
            key={activeSlide.src}
            src={activeSlide.src}
            alt={activeSlide.alt}
            fill
            loading="eager"
            sizes="(max-width: 1024px) 100vw, 70vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent lg:hidden" />
        </div>

        <div className="flex min-h-80 flex-col justify-between p-7 text-white sm:p-9">
          <div aria-live="polite">
            <p className="text-xs font-semibold tracking-[0.22em] text-[#ef9b84] uppercase">
              {activeSlide.eyebrow}
            </p>
            <p className="mt-4 font-mono text-xs text-stone-500">
              {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </p>
            <h3 className="mt-8 text-3xl font-semibold tracking-[-0.05em]">
              {activeSlide.title}
            </h3>
            <p className="mt-4 text-sm leading-7 text-stone-400">
              {activeSlide.description}
            </p>
          </div>

          <div className="mt-10">
            <div className="mb-6 flex gap-2" role="group" aria-label="Choisir une image">
              {slides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  aria-pressed={index === activeIndex}
                  aria-label={`Afficher l'image ${index + 1} : ${slide.title}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-10 bg-[#ef9b84]" : "w-5 bg-white/25 hover:bg-white/50"}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={showPrevious}
                aria-label="Image precedente"
                className="grid size-12 place-items-center rounded-full border border-white/15 text-white transition hover:bg-white hover:text-stone-950"
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Image suivante"
                className="grid size-12 place-items-center rounded-full bg-white text-stone-950 transition hover:bg-[#ef9b84]"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
