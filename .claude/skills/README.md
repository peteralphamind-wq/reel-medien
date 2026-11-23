# Video-Skills in diesem Repo

Schau, hier liegen die Schnitt-Skills, die Claude in diesem Projekt von sich aus findet. Du musst also nichts installieren, du tippst einfach den Befehl mit Schrägstrich oder sagst in normalen Worten, was du mit deinen Clips vorhast.

Der Code stammt nicht von mir, sondern von den Leuten in der Tabelle. Jeder Ordner hat seine eigene `LICENSE`, und der Stand ist auf einen bestimmten Commit festgenagelt, damit sich nichts heimlich ändert.

| Befehl | Woher | Stand (Commit) | Lizenz | Braucht zusätzlich |
|---|---|---|---|---|
| `/edit-video` | coleam00/skills | `8c30da9` | MIT | `uv`, für die volle Pipeline einen OpenRouter-Key |
| `/video-edit` | yerinsabraham/video-edit-skill | `fe3b198` | Apache-2.0 | einmal `setup.py --install` für Whisper und Freisteller |
| `/videoediting` | blazerior/videoediting-claude-skill | `b9a2cbf` | MIT | Whisper lokal oder Groq- bzw. OpenAI-Key |
| `/trial-reels`, `/behind-the-person`, `/explainer`, `/split-screen`, `/ranking-list`, `/storytelling`, `/orbit-reel`, `/picture-stack`, `/scene-switch`, `/shape-shift`, `/visual-notes` | artemnovitckii/claude-editing-skills | `beff6b8` | MIT | Groq-Key fürs Transkript, HyperFrames über `npx` |
| `/find-youtube-clips-and-quotes`, `/restyle-reference-video`, `/v2v-video-to-video-swap`, `/clean-up-ai-video`, `/check-video-render`, `/write-aimv-recipe` | aimvgg/claude-video-editing-skills | `c129d39` | Apache-2.0 | je nach Skill OpenRouter-Key und einen R2- oder S3-Speicher |
| `/fable-vfx` | bhavya-gx/fable-vfx | `d89e97e` | MIT | Python-Pakete aus `requirements.txt`, Whisper lokal |
| `/fable-video-edit` | filipenevola/fable-video-edit | `fdc4f5e` | MIT | Whisper, für Motion Graphics Remotion |
| `/tenfold-video-edit` | tenfoldmarc/video-edit-skill | `3f01f2e` | keine | siehe unten |

## Was ich am Original angepasst habe

Ehrlich gesagt fast nichts, aber drei Sachen musst du wissen.

- **`/video-edit`**: Im Original steht `${CLAUDE_PLUGIN_ROOT}` als Pfad, weil der Skill dort als Plugin läuft. Hier liegt er als Projekt-Skill, darum steht in `SKILL.md` jetzt `${CLAUDE_SKILL_DIR}`. Der Ordner `shared/` liegt direkt im Skill-Ordner, genau so, wie es der Installer des Autors auch macht.
- **`/fable-vfx`**: Das ganze Werkzeug (`render.py`, `vfx/`, `configs/` und so weiter) liegt im Skill-Ordner statt in einem eigenen Repo. Der erste Satz in `SKILL.md` zeigt darum auf diesen Ordner.
- **Die elf Skills von Artem**: Die teilen sich einen Werkzeugkasten. Der liegt in `.claude/kit/`, die Beispielbilder in `.claude/assets/style-showcase/`. Die Demo-Videos aus `docs/` habe ich weggelassen, die braucht kein Skript.

## Der eine Skill ohne Lizenz

Das Repo von tenfoldmarc hat keine Lizenz. Das heisst, sagen wir mal, du darfst es für dich holen und brauchen, aber ich darf es nicht einfach in ein öffentliches Repo kopieren. Darum liegt hier nur ein kleines Skript, das den Skill lokal holt:

```bash
bash .claude/install-tenfold-video-edit.sh
```

Der Ordner steht in `.gitignore` und wandert nie ins Repo. Weil der Skill im Original gleich heisst wie der von yerinsabraham, benennt ihn das Skript in `tenfold-video-edit` um. In einer Cloud-Sitzung musst du das Skript pro Sitzung einmal laufen lassen, weil der Container danach wieder weg ist.

## Aktualisieren

Wenn ein Autor etwas Neues rausbringt, sag Claude einfach «aktualisier den Skill von …». Dann wird der neue Stand zuerst durchgeschaut und erst danach hier abgelegt. So bleibt die Sache sauber.
