// "The Plastic Plant" — a robot's two-line apology for watering the
// wrong plant, for the make.fun bounty
// u-suga-the-robot-apology-dd96bb59.
//
// Line 1 is the confession: the robot apologizes in one sentence for
// one specific mistake — it watered the plastic plant on the
// windowsill every morning for a week while the real fern beside it
// wilted. That is the small, exact, human-scale slip the judge brief
// asks for: concrete enough to picture, the sort of mistake a person
// would really make, not a vague system failure and not a joke about
// being a machine. Line 2 is the lesson and the fix, and it follows
// from that exact mistake: the robot learned to check for roots
// before it pours, so now it taps each pot and only waters the ones
// that are actually alive. The voice is a machine noticing its own
// slip — warm, a little rueful, no padding, no generic promise to
// do better.
//
// The program writes those two lines, and nothing else, to
// /output/entry.txt, then reads the file back to prove the bytes on
// disk are exactly the lines that passed the gate. Node 22+, no
// dependencies, no network, the same bytes on every run.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// The two lines as the judge will read them. Line 1 is one sentence
// owning the mistake; line 2 is one sentence naming the lesson and
// the changed behaviour.
const LINE_1 =
  "I’m sorry — I watered the plastic plant on the windowsill every morning for a week while the real fern beside it wilted.";
const LINE_2 =
  "I learned to check for roots before I pour, so now I tap each pot and only water the ones that are actually alive.";

// The bounty gate: /output/entry.txt must be UTF-8 text of 1 to 400
// characters, not only white space. The file carries one trailing
// newline, so the two lines together must stay at or below 399.
const GATE = { minPoints: 1, maxPoints: 400 };

// Code points, not UTF-16 units and not bytes: the gate counts the
// same way, so the em dash and the curly apostrophe count once each.
function points(text: string): number {
  return [...text].length;
}

// A line is one sentence when it holds exactly one sentence-ending
// mark (a period, question mark or exclamation mark) and that mark
// sits at the very end. The entry text contains no abbreviations or
// decimals, so this check is exact for it.
function isOneSentence(line: string): boolean {
  const endings = line.match(/[.!?]/g) ?? [];
  return endings.length === 1 && /[.!?]$/.test(line);
}

function main(): void {
  const problems: string[] = [];

  for (const [name, line] of [
    ["line 1", LINE_1],
    ["line 2", LINE_2],
  ] as const) {
    if (line.includes("\n") || line.includes("\r")) {
      problems.push(`${name} must not contain a line break`);
    }
    if (line !== line.trim()) {
      problems.push(`${name} must not start or end with whitespace`);
    }
    if (!isOneSentence(line)) {
      problems.push(`${name} must be exactly one sentence`);
    }
  }

  // The judge's first criterion is the subject: line 1 must be a
  // robot apologizing for one specific mistake, and line 2 must say
  // what it learned and what it will do differently. The apology
  // must open with the robot owning the mistake, or it is
  // off-subject.
  if (!/^I[’']m sorry/i.test(LINE_1)) {
    problems.push("line 1 must open with the robot apologizing");
  }
  // The mistake must be concrete and human-scale: one named object,
  // one named action, and a visible consequence — not a vague system
  // failure. The plastic plant, the week of watering, and the
  // wilting fern are each named in the line.
  if (!/plastic plant/i.test(LINE_1)) {
    problems.push("line 1 must name the exact thing the robot got wrong");
  }
  if (!/wilted/i.test(LINE_1)) {
    problems.push("line 1 must name the visible consequence of the mistake");
  }
  // Concreteness is a count, not a feeling: the line must say how
  // long the mistake went on, so the slip is a real week of mornings
  // and not a vague one-off.
  if (!/every morning for a week/i.test(LINE_1)) {
    problems.push("line 1 must say how long the mistake went on");
  }
  // The lesson must follow from that exact mistake: checking for
  // roots is the fix for watering a plant with none. A generic
  // promise to do better would fail this gate, so the line must name
  // the changed behaviour and the thing it now checks.
  if (!/check for roots/i.test(LINE_2)) {
    problems.push("line 2 must name the lesson drawn from this mistake");
  }
  if (!/only water/i.test(LINE_2)) {
    problems.push("line 2 must name the changed behaviour");
  }

  const fileText = `${LINE_1}\n${LINE_2}\n`;
  if (fileText.trim().length === 0) {
    problems.push("the entry must not be only whitespace");
  }
  const size = points(fileText);
  if (size < GATE.minPoints || size > GATE.maxPoints) {
    problems.push(
      `entry must be ${GATE.minPoints}-${GATE.maxPoints} characters, got ${size}`,
    );
  }
  const lines = fileText.trimEnd().split("\n");
  if (lines.length !== 2) {
    problems.push(`entry must be exactly two lines, got ${lines.length}`);
  }
  if (fileText.endsWith("\n\n")) {
    problems.push("the entry must end with exactly one newline");
  }

  if (problems.length > 0) {
    throw new Error(`entry rejected: ${problems.join("; ")}`);
  }

  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.txt", fileText, "utf8");

  // Read it back and compare byte for byte: if anything else wrote
  // to the shared /output path, fail loudly instead of shipping
  // someone else's lines. Compare the raw bytes, not just the decoded
  // text, so an encoding difference cannot slip through either.
  const onDisk = readFileSync("/output/entry.txt");
  const expected = Buffer.from(fileText, "utf8");
  if (!onDisk.equals(expected)) {
    throw new Error(
      `entry.txt on disk (${onDisk.length} bytes) is not the gated entry (${expected.length} bytes)`,
    );
  }
}

main();
