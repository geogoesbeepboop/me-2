import type { MDXComponents } from "mdx/types";
import Section from "@/components/dossier/Section";
import ArchitectureDiagram from "@/components/artifacts/ArchitectureDiagram";
import SystemDeepDive from "@/components/artifacts/SystemDeepDive";
import AgentGraph from "@/components/artifacts/AgentGraph";
import TerminalLog from "@/components/artifacts/TerminalLog";
import BuildTimeline from "@/components/artifacts/BuildTimeline";
import WhatBroke from "@/components/artifacts/WhatBroke";
import Decision from "@/components/artifacts/Decision";
import NextUp from "@/components/artifacts/NextUp";
import Ref from "@/components/artifacts/Ref";
import Update from "@/components/artifacts/Update";
import OpenQuestions from "@/components/artifacts/OpenQuestions";
import Bench from "@/components/artifacts/Bench";
import Ladder from "@/components/artifacts/Ladder";
import LaneBoard from "@/components/artifacts/LaneBoard";
import SetConsole from "@/components/artifacts/SetConsole";
import PantryConsole from "@/components/artifacts/PantryConsole";
import X402Console from "@/components/artifacts/X402Console";
import MandateConsole from "@/components/artifacts/MandateConsole";

/**
 * Prose defaults + the artifact library. Text keeps a 68ch measure;
 * artifacts (diagrams, logs, timelines) take the full column — the
 * dense-against-calm contrast is the aesthetic.
 */

function anchored(Tag: "h2" | "h3") {
  return function Heading({
    id,
    children,
  }: {
    id?: string;
    children?: React.ReactNode;
  }) {
    return (
      <Tag
        id={id}
        className={`group scroll-mt-32 font-bold text-bone uppercase stretch-110 ${
          Tag === "h2" ? "mt-14 mb-5 text-title" : "mt-10 mb-4 text-[1.15rem]"
        }`}
      >
        {children}
        {id && (
          <a
            href={`#${id}`}
            aria-label="Link to this section"
            className="ml-3 font-mono text-mono-sm font-normal text-dim opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
          >
            #
          </a>
        )}
      </Tag>
    );
  };
}

export const mdxComponents: MDXComponents = {
  h2: anchored("h2"),
  h3: anchored("h3"),
  p: (props) => (
    <p className="max-w-[68ch] text-body leading-[1.8] text-bone/80" {...props} />
  ),
  a: (props) => (
    <a
      className="text-bone underline decoration-line-loud underline-offset-4 transition-colors duration-300 hover:decoration-ember"
      {...props}
    />
  ),
  ul: (props) => (
    <ul
      className="max-w-[68ch] list-none space-y-2 text-bone/80 [&>li]:relative [&>li]:pl-6 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:content-['—'] [&>li]:before:text-dim"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="max-w-[68ch] list-decimal space-y-2 pl-5 text-bone/80 marker:font-mono marker:text-mono-sm marker:text-dim"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="max-w-[68ch] border-l border-bone/25 pl-6 text-bone/65 italic"
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="border border-line bg-panel px-1.5 py-0.5 font-mono text-[0.85em] text-bone"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="my-8 overflow-x-auto border border-line bg-panel p-5 font-mono text-mono-sm leading-[1.8] text-ash [&>code]:border-0 [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    />
  ),
  hr: () => <hr className="my-12 border-line" />,
  strong: (props) => <strong className="font-semibold text-bone" {...props} />,
  // the artifact library — available in every MDX file
  Section,
  ArchitectureDiagram,
  SystemDeepDive,
  AgentGraph,
  TerminalLog,
  BuildTimeline,
  WhatBroke,
  Decision,
  NextUp,
  Ref,
  Update,
  OpenQuestions,
  Bench,
  Ladder,
  LaneBoard,
  SetConsole,
  PantryConsole,
  X402Console,
  MandateConsole,
};
