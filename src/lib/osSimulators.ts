/**
 * Smart Study AI - Operating Systems Simulators & Pedagogical Metrics
 *
 * Provides:
 * 1. Independent deterministic Page Replacement simulator (FIFO, LRU, Optimal / Belady's Min)
 * 2. Belady's Anomaly verification
 * 3. Topic difficulty classifier based on scope and terminology
 * 4. Topic duration estimator based on scope, difficulty, and concept breadth
 * 5. Clean pedagogical theory description synthesizer
 */

export type PageReplacementAlgorithm = "FIFO" | "LRU" | "OPTIMAL";

export interface PageReplacementStep {
  time: number;
  page: number;
  frames: number[];
  hit: boolean;
  victim?: number;
}

export interface PageReplacementSimulationResult {
  algorithm: PageReplacementAlgorithm;
  frameCount: number;
  referenceString: number[];
  pageFaults: number;
  hits: number;
  hitRatio: number;
  faultRatio: number;
  steps: PageReplacementStep[];
}

/**
 * Deterministic Page Replacement Simulator
 * Supports FIFO, LRU, and Optimal (Belady's Min) with standard deterministic tie-breaking.
 */
export function simulatePageReplacement(
  referenceString: number[],
  frameCount: number,
  algorithm: PageReplacementAlgorithm
): PageReplacementSimulationResult {
  if (frameCount <= 0) {
    throw new Error("Frame count must be greater than 0");
  }

  const frames: number[] = [];
  let pageFaults = 0;
  let hits = 0;
  const loadTimes = new Map<number, number>();
  const lastUsedTimes = new Map<number, number>();
  const steps: PageReplacementStep[] = [];

  for (let t = 0; t < referenceString.length; t++) {
    const page = referenceString[t];
    const isHit = frames.includes(page);

    if (isHit) {
      hits++;
      lastUsedTimes.set(page, t);
      steps.push({
        time: t,
        page,
        frames: [...frames],
        hit: true,
      });
      continue;
    }

    // Page fault occurs
    pageFaults++;

    if (frames.length < frameCount) {
      // Free frame available
      frames.push(page);
      loadTimes.set(page, t);
      lastUsedTimes.set(page, t);
      steps.push({
        time: t,
        page,
        frames: [...frames],
        hit: false,
      });
    } else {
      // Eviction required
      let victim: number | null = null;

      if (algorithm === "FIFO") {
        // Evict page with the oldest load time
        let oldestTime = Infinity;
        for (const p of frames) {
          const lt = loadTimes.get(p) ?? 0;
          if (lt < oldestTime) {
            oldestTime = lt;
            victim = p;
          }
        }
      } else if (algorithm === "LRU") {
        // Evict page with the oldest last-used time
        let leastRecentTime = Infinity;
        for (const p of frames) {
          const lu = lastUsedTimes.get(p) ?? 0;
          if (lu < leastRecentTime) {
            leastRecentTime = lu;
            victim = p;
          }
        }
      } else if (algorithm === "OPTIMAL") {
        // Evict page that will not be used for the longest period in the future
        let farthestFutureUse = -1;
        for (const p of frames) {
          let nextUse = Infinity;
          for (let fut = t + 1; fut < referenceString.length; fut++) {
            if (referenceString[fut] === p) {
              nextUse = fut;
              break;
            }
          }
          if (nextUse > farthestFutureUse) {
            farthestFutureUse = nextUse;
            victim = p;
          } else if (nextUse === farthestFutureUse && nextUse === Infinity) {
            // Deterministic tie-break for multiple unreferenced pages: FIFO (oldest loaded)
            if ((loadTimes.get(p) ?? 0) < (loadTimes.get(victim!) ?? 0)) {
              victim = p;
            }
          }
        }
      }

      if (victim === null || victim === undefined) {
        victim = frames[0];
      }

      const victimIndex = frames.indexOf(victim);
      frames[victimIndex] = page;
      loadTimes.delete(victim);
      loadTimes.set(page, t);
      lastUsedTimes.set(page, t);

      steps.push({
        time: t,
        page,
        frames: [...frames],
        hit: false,
        victim,
      });
    }
  }

  const total = referenceString.length;
  return {
    algorithm,
    frameCount,
    referenceString,
    pageFaults,
    hits,
    hitRatio: total > 0 ? hits / total : 0,
    faultRatio: total > 0 ? pageFaults / total : 0,
    steps,
  };
}

/**
 * Determines an academically appropriate difficulty label based on topic scope,
 * complexity, and terminology, rather than inflating difficulty solely because
 * a topic appears later in the roadmap.
 */
export function determineTopicDifficulty(
  rawTitle: string,
  cleanTitle: string,
  unitNumber?: number,
  _domain?: string
): "Beginner" | "Intermediate" | "Advanced" {
  const combined = `${rawTitle || ""} ${cleanTitle || ""}`.toLowerCase();

  // 1. Explicit Beginner indicators (foundations, definitions, OS types, structures)
  const isBeginner =
    /\b(intro|introduction|overview|fundamentals?|foundations?|basics?|definitions?|types?|components?|structure|history|evolution|elementary|principles? of|os types|system calls?|services|user interface)\b/i.test(
      combined
    );

  // 2. Explicit Advanced indicators (complex synchronization, security, kernel internals, distributed, virtual memory algorithms)
  const isAdvanced =
    /\b(advanced|distributed|security|protection|cryptograph|virtualization|concurrency|deadlocks?|banker's|dining philosophers|page replacement|tlb miss|kernel internals|optimization|fault tolerance|multiprocessor|multicore|real-time|rtos|recovery|serializability)\b/i.test(
      combined
    );

  if (isBeginner && !isAdvanced) {
    return "Beginner";
  }

  if (isAdvanced) {
    return "Advanced";
  }

  // Unit 1 defaults to Beginner if not explicitly marked advanced
  if (unitNumber === 1) {
    return "Beginner";
  }

  // Core mechanisms (CPU scheduling, basic memory management, file systems, storage)
  return "Intermediate";
}

/**
 * Estimates study time (in minutes) based on topic scope, complexity, and composite breadth,
 * avoiding flat identical durations across all milestones.
 */
export function estimateTopicDuration(
  rawTitle: string,
  cleanTitle: string,
  difficulty: "Beginner" | "Intermediate" | "Advanced",
  baseDailyMinutes: number = 60
): number {
  const combined = `${rawTitle || ""} ${cleanTitle || ""}`.toLowerCase();
  const base = Math.max(30, Math.min(240, Number(baseDailyMinutes) || 60));

  // Determine complexity multiplier
  let multiplier = 1.0;

  if (difficulty === "Beginner") {
    // Foundational concepts, definitions, OS types require concise focused study
    multiplier = 0.65;
  } else if (difficulty === "Advanced") {
    // Advanced algorithmic mechanics, proof derivations, and numerical simulations
    multiplier = 1.3;
  } else {
    // Intermediate core mechanisms
    multiplier = 1.0;
  }

  // Broad composite check: multiple sub-domains linked by & or comma or "and"
  const isComposite = /(&|\band\b|,|\/)/i.test(cleanTitle);
  if (isComposite) {
    multiplier += 0.15;
  }

  // Specific high-workload topics
  if (/page replacement|virtual memory|deadlock|cpu scheduling|round robin/i.test(combined)) {
    multiplier += 0.1;
  }

  let calculated = Math.round((base * multiplier) / 5) * 5;
  // Clamp between 30 and 150 minutes
  calculated = Math.max(30, Math.min(150, calculated));

  return calculated;
}

/**
 * Synthesizes a clean, substantive academic theory description for a milestone topic,
 * completely avoiding repetitive boilerplate such as "Comprehensive academic principles,
 * core mechanisms, worked examples, and exam problem strategies for...".
 */
export function generateTopicTheoryDescription(
  rawTitle: string,
  cleanTitle: string,
  subject: string,
  _unitNumber?: number
): string {
  const combined = `${rawTitle || ""} ${cleanTitle || ""}`.toLowerCase();
  const subLower = (subject || "").toLowerCase();

  // Operating Systems domain
  if (subLower.includes("operating system") || subLower === "os") {
    if (/intro|introduction|overview|types|structure|system call/i.test(combined)) {
      return "Fundamental operating system architecture, user and kernel execution modes, system call interfaces, and classification of operating system types.";
    }
    if (/process|scheduling|pcb|thread|cpu scheduling/i.test(combined)) {
      return "Process life cycle states, Process Control Block (PCB) structures, context switching overhead, and preemptive CPU scheduling algorithms including Round Robin and SJF.";
    }
    if (/memory|paging|virtual memory|page replacement/i.test(combined)) {
      return "Virtual memory translation, demand paging architectures, Translation Lookaside Buffer (TLB) caching, Effective Memory Access Time (EMAT), and page replacement policies.";
    }
    if (/storage|file|disk/i.test(combined)) {
      return "File system abstractions, directory organization, disk block allocation strategies, and disk arm scheduling algorithms including SSTF, SCAN, and C-SCAN.";
    }
    if (/protection|security|access control|threat/i.test(combined)) {
      return "System protection domains, access control matrices, user authentication, authorization boundaries, and defense against malicious software threats.";
    }
    if (/concurrency|synchronization|deadlock|semaphore/i.test(combined)) {
      return "Critical section management, mutual exclusion primitives, semaphores, monitors, and deadlock characterization via the four Coffman conditions.";
    }
  }

  // Database / DBMS domain
  if (subLower.includes("dbms") || subLower.includes("database")) {
    if (/intro|architecture/i.test(combined)) {
      return "Three-schema database architecture, data independence, DBMS components, and roles of the Database Administrator.";
    }
    if (/er model|entity/i.test(combined)) {
      return "Entity-relationship modeling, entity sets, attributes, candidate keys, weak entity sets, and cardinality constraints.";
    }
    if (/relational|sql/i.test(combined)) {
      return "Relational algebra operations, schema constraints, referential integrity, and declarative SQL DDL and DML constructs.";
    }
    if (/normal|dependency/i.test(combined)) {
      return "Functional dependencies, update anomalies, normalization algorithms from 1NF through BCNF, and lossless join decomposition.";
    }
    if (/transaction|acid|concurrency|recovery/i.test(combined)) {
      return "ACID transaction guarantees, serializability testing, two-phase locking protocols, deadlock prevention, and write-ahead logging.";
    }
  }

  // General academic clean synthesis
  return `Core theoretical concepts, governing principles, architectural mechanisms, and analytical problem-solving for ${cleanTitle}.`;
}
