import { round, score } from './score.js';

/**
 * Path to directory containing lists
 */
const dir = '/data';

// --- Helper to add folder info to levels ---
async function fetchLevels(arr, folders) {
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
                console.error(`Failed to load level #${rank + 1} ${path}. Tried: ${triedDirs.join(', ')}`);
                return [null, path];
            }

            return [
                {
                    ...level,
                    path,
                    records: Array.isArray(level.records)
                        ? level.records.sort((a, b) => b.percent - a.percent)
                        : [],
                    folder: folderUsed, // this will be used in the DOM
                },
                null,
            ];
        })
    );
}

// --- Fetch main list ---
export async function fetchList() {
    try {
        const listResult = await fetch(`${dir}/_list.json`);
        const list = await listResult.json();
        return fetchLevels(list, [`${dir}/list`]);
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
        return fetchLevels(list, [`${dir}/clist`]);
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
        const folders = [`${dir}/ilist`, `${dir}/list`]; // try ilist first, then list
        return fetchLevels(arr, folders);
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
