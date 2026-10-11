// credit to DavidHDev scrollreveal
"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import styles from "./ScrollRevealText.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollRevealText() {
  const containerRef = useRef(null);

  const text = `
    Many adults today train without proper guidance,
    and some may not know how to interpret the signals their bodies are giving them.
  `;

  const splitText = useMemo(() => {
    return text
      .trim()
      .split(/(\s+)/)
      .map((part, index) => {
        if (part.match(/^\s+$/)) {
          return part;
        }

        return (
          <span className="word" key={index}>
            {part}
          </span>
        );
      });
  }, []);

  useEffect(() => {
    const el = containerRef.current;

    if (!el) return;

    const words = el.querySelectorAll(".word");

    gsap.fromTo(
      words,
      {
        color: "rgb(180, 180, 180)",
      },
      {
        color: "rgb(0, 0, 0)",
        ease: "none",

        stagger: 0.05,

        scrollTrigger: {
          trigger: el,

          start: "top 85%",

          end: "top 35%",

          scrub: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        trigger.kill();
      });
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="scroll-reveal-section"
    >
      <h2 className="scroll-reveal-text">
        {splitText}
      </h2>
    </section>
  );
}