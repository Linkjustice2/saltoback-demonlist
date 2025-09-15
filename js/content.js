import { round, score } from './score.js';

/**
 * Path to directory containing lists
 */
const dir = '/data';

// --- Fetch main list ---
export async function fetchList() {
    try {
        const listResult = await fetch(`${dir}/_list.json`);
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    const levelResult = await fetch(`${dir}/list/${path}.json`);
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort((a, b) => b.percent - a.percent),
                            cssClass: "normal-list", // mark explicitly
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load main list.`);
        return null;
    }
}

// --- Fetch challenge list ---
export async function fetchChallengeList() {
    try {
        const listResult = await fetch(`${dir}/_clist.json`);
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    const levelResult = await fetch(`${dir}/clist/${path}.json`);
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort((a, b) => b.percent - a.percent),
                            cssClass: "challenge-list", // optional marker
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load challenge level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load challenge list.`);
        return null;
    }
}

// --- Fetch impossible list ---
export async function fetchIlist() {
    try {
        const listRes = await fetch(`${dir}/_ilist.json`);
        if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
        const arr = await listRes.json();

        const folders = [`${dir}/ilist`, `${dir}/list`]; // folders to try for each level

        return await Promise.all(
            arr.map(async (path, rank) => {
                let level = null;
                let triedDirs = [];
                let folderUsed = null;

                for (const folder of folders) {
                    try {
                        const res = await fetch(`${folder}/${path}.json`);
                        if (!res.ok) {
                            triedDirs.push(folder);
                            continue;
                        }
                        level = await res.json();
                        folderUsed = folder;
                        break;
                    } catch {
                        triedDirs.push(folder);
                    }
                }

                if (!level) {
                    console.error(`Failed to load impossible level #${rank + 1} ${path}. Tried: ${triedDirs.join(', ')}`);
                    return [null, path];
                }

                // detect if from list/ but not ilist/
                const isNormalList = folderUsed.includes("/list") && !folderUsed.includes("/ilist");

                return [
                    {
                        ...level,
                        path,
                        records: Array.isArray(level.records)
                            ? level.records.sort((a, b) => b.percent - a.percent)
                            : [],
                        folder: folderUsed,
                        cssClass: isNormalList ? "normal-list" : "ilist", // add CSS hook
                    },
                    null,
                ];
            })
        );
    } catch (err) {
        console.error(`Failed to load impossible list:`, err);
        return null;
    }
}

// --- Fetch editors ---
export async function fetchEditors() {
    try {
        const editorsResult = await fetch(`${dir}/_editors.json`);
        if (!editorsResult.ok) throw new Error(`HTTP ${editorsResult.status}`);
        return await editorsResult.json();
    } catch {
        return null;
    }
}

// --- Main leaderboard ---
export async function fetchLeaderboard() {
    const list = await fetchList();
    if (!list) return [[], []];

    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        const verifier = Object.keys(scoreMap).find(u => u.toLowerCase() === level.verifier.toLowerCase()) || level.verifier;
        scoreMap[verifier] ??= { verified: [], completed: [], progressed: [] };
        scoreMap[verifier].verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        level.records.forEach(record => {
            const user = Object.keys(scoreMap).find(u => u.toLowerCase() === record.user.toLowerCase()) || record.user;
            scoreMap[user] ??= { verified: [], completed: [], progressed: [] };
            if (record.percent === 100) {
                scoreMap[user].completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
            } else {
                scoreMap[user].progressed.push({
                    rank: rank + 1,
                    level: level.name,
                    percent: record.percent,
                    score: score(rank + 1, record.percent, level.percentToQualify),
                    link: record.link,
                });
            }
        });
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const total = [scores.verified, scores.completed, scores.progressed].flat().reduce((sum, cur) => sum + cur.score, 0);
        return { user, total: round(total), ...scores };
    });

    return [res.sort((a, b) => b.total - a.total), errs];
}

// --- Challenge leaderboard ---
export async function fetchChallengeLeaderboard() {
    const list = await fetchChallengeList();
    if (!list) return [[], []];

    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        const verifier = Object.keys(scoreMap).find(u => u.toLowerCase() === level.verifier.toLowerCase()) || level.verifier;
        scoreMap[verifier] ??= { verified: [], completed: [], progressed: [] };
        scoreMap[verifier].verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        level.records.forEach(record => {
            const user = Object.keys(scoreMap).find(u => u.toLowerCase() === record.user.toLowerCase()) || record.user;
            scoreMap[user] ??= { verified: [], completed: [], progressed: [] };
            if (record.percent === 100) {
                scoreMap[user].completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
            } else {
                scoreMap[user].progressed.push({
                    rank: rank + 1,
                    level: level.name,
                    percent: record.percent,
                    score: score(rank + 1, record.percent, level.percentToQualify),
                    link: record.link,
                });
            }
        });
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const total = [scores.verified, scores.completed, scores.progressed].flat().reduce((sum, cur) => sum + cur.score, 0);
        return { user, total: round(total), ...scores };
    });

    return [res.sort((a, b) => b.total - a.total), errs];
}
