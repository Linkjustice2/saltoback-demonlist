import { round, score } from './score.js';

const dir = '/data';

/* =========================
   Fetch main list
========================= */
export async function fetchList() {
    try {
        const res = await fetch(`${dir}/_list.json`);
        const list = await res.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    const levelResult = await fetch(`${dir}/list/${path}.json`);
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort((a,b)=>b.percent-a.percent)
                        },
                        null
                    ];
                } catch {
                    console.error(`Failed to load level #${rank+1} ${path}`);
                    return [null, path];
                }
            })
        );
    } catch {
        console.error(`Failed to load main list`);
        return null;
    }
}

/* =========================
   Fetch impossible list
========================= */
export async function fetchIlist() {
    try {
        const listRes = await fetch(`${dir}/_ilist.json`);
        if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
        const arr = await listRes.json();

        const folders = [`${dir}/ilist`, `${dir}/list`]; // try both folders

        return await Promise.all(
            arr.map(async (path, rank) => {
                let level = null;
                let folderUsed = null;
                let triedDirs = [];

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
                    console.error(`Failed to load impossible level #${rank+1} ${path}. Tried: ${triedDirs.join(', ')}`);
                    return [null, path];
                }

                // tag reference if from /list
                const isReference = folderUsed.endsWith('list');

                return [
                    {
                        ...level,
                        path,
                        folder: folderUsed,
                        records: Array.isArray(level.records) ? level.records.sort((a,b)=>b.percent-a.percent) : [],
                        isReference
                    },
                    null
                ];
            })
        );
    } catch (err) {
        console.error(`Failed to load impossible list:`, err);
        return null;
    }
}

/* =========================
   Fetch editors
========================= */
export async function fetchEditors() {
    try {
        const res = await fetch(`${dir}/_editors.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch {
        return null;
    }
}

/* =========================
   Render Impossible List (example)
========================= */
export function renderImpossibleList(levels) {
    const container = document.getElementById("impossible-list");
    container.innerHTML = '';

    levels.forEach(([level]) => {
        if (!level) return;

        const div = document.createElement('div');
        div.classList.add('level');

        const button = document.createElement('button');
        button.textContent = level.isReference ? `(reference) ${level.name}` : level.name;

        if (level.isReference) button.classList.add('reference');

        div.appendChild(button);
        container.appendChild(div);
    });
}
