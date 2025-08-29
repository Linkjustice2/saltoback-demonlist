import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading" class="page-list">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list" @mousemove="updateMouse" :style="backgroundStyle">
            <div class="list-container">
                <table class="list" v-if="list.length">
                    <tr v-for="([level, err], i) in list" :key="i">
                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ active: selected === i, error: !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container" v-if="level">
                <div class="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors 
                        :author="level.author" 
                        :creators="level.creators" 
                        :verifier="level.verifier"
                    />
                    <iframe class="video" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected + 1 <= 150"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record" :key="record.user + record.percent">
                            <td class="percent"><p>{{ record.percent }}%</p></td>
                            <td class="user"><a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a></td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class="level-container" v-else class="level" style="display:flex;justify-content:center;align-items:center;height:100%;">
                <p>(ノಠ益ಠ)ノ彡┻━┻</p>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-if="errors.length">
                        <p class="error" v-for="(error, idx) in errors" :key="idx">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">
                            Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a>
                        </p>
                    </div>
                    <template v-if="editors.length">
                        <h3>GDPS Staff</h3>
                        <ol class="editors">
                            <li v-for="editor in editors" :key="editor.name">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                </div>
            </div>
        </main>
    `,
    data() {
        return {
            list: [],
            editors: [],
            loading: true,
            selected: 0,
            errors: [],
            store,
            mouseX: 0,
            mouseY: 0
        };
    },
    computed: {
        level() {
            return this.list[this.selected]?.[0];
        },
        video() {
            if (!this.level) return "";
            if (!this.level.showcase) return embed(this.level.verification);
            return embed(this.level.showcase);
        },
        backgroundStyle() {
            if (!this.level) return {};
            const thumb = this.level.thumbnail || `https://img.youtube.com/vi/${this.level.verification.split('v=')[1]}/hqdefault.jpg`;
            const moveX = (this.mouseX - window.innerWidth / 2) / 50;
            const moveY = (this.mouseY - window.innerHeight / 2) / 50;
            return {
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundImage: `url(${thumb})`,
                backgroundSize: "cover",
                backgroundPosition: `calc(50% + ${moveX}px) calc(50% + ${moveY}px)`,
                filter: "blur(20px) brightness(0.45)",
                zIndex: -1,
                transition: "background-position 0.1s"
            };
        }
    },
    async mounted() {
        try {
            this.list = await fetchList() || [];
            this.editors = await fetchEditors() || [];
        } catch (e) {
            console.error(e);
            this.errors.push("Failed to load list or editors.");
        }
        this.loading = false;
    },
    methods: {
        embed,
        score,
        updateMouse(e) {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        }
    }
};
