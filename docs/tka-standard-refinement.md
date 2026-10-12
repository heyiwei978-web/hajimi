# TKA standard record coherence — second pass

Date: 2026-10-12
Branch: fix/tka-record-coherence-20261012
Status: draft PR only; NOT deployed.

## Confirmed targeted defects in published example

1. POD1 and POD2 described “引流/拔管过程平稳” even though drain remains in place (120ml and 55ml). POD3 records removal after 20ml.
2. The generated TKA discharge-day ward round contained the “手术日期” field joined into an unrelated clinical sentence; it could mislead a clinician copying the template.
3. The TKA operative record had a directive about recording patellar resurfacing/PCL retention inside the past-tense operative narrative. These two actual operative decisions cannot be determined from the example, so they are now visible verification placeholders.
4. Some TKA rounds appended a generic “结合患者病史……动态评价病情” conclusion that did not identify a disease-specific decision.

## Changes

- Adds a last-pass script after v27 to touch ONLY standard TKA record bodies already generated in memory.
- Distinguishes retained vs removed drain by POD and confines changes to the corresponding documents.
- Replaces the broken discharge-day prose with a deliberately labelled teaching example, preserving the model patient's day-of-discharge figures but requiring replacement based on actual examination.
- Swaps selected generic attending recommendations for TKA-specific assessment and plan.
- Keeps all existing chapters and the 2 TKA special-case bundles; all other specialties, diseases, and records remain byte-identical.
- Does NOT invent whether the patella was resurfaced or the PCL was retained; those fields require the operative report's actual observation.

## Verification and review

Run npm test, npm run build, npm run test:browser on the branch. A new test directly compares all published-source records generated with and without the v28 pass to ensure the entire non-TKA content and special-case sources are identical.

Before merging, review the actual clinical language and medical accuracy independently; the new script is NOT clinical approval. Use an anonymized case in all tests. Do not deploy until reviewed.
