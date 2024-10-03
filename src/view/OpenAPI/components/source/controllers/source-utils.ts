import { closeBrackets } from '@codemirror/autocomplete';
import { history } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import {
    bracketMatching,
    defaultHighlightStyle,
    foldGutter,
    indentOnInput,
    LanguageSupport,
    syntaxHighlighting,
} from '@codemirror/language';
import { lintGutter } from '@codemirror/lint';
import { highlightSelectionMatches } from '@codemirror/search';
import { Annotation, EditorState, Extension } from '@codemirror/state';
import {
    EditorView,
    highlightActiveLine,
    keymap,
    lineNumbers,
    ViewUpdate,
} from '@codemirror/view';
import { setIcon } from 'obsidian';
import { eventID } from '../../../../../events-management/typing/constants';
import {
    EditorChangedEvent,
    SwitchModeStateEvent,
} from '../../../../../events-management/typing/interfaces';
import { OpenAPIView } from '../../../OpenAPI-view';
import openAPIFormatter from '../extensions/formatter';
import createBoundKeymap from '../extensions/keymap';
import { linkHighlightExtension } from '../extensions/linkHighLighting';
import yamlJsonLinter from '../extensions/linter';
import OpenAPICompletionExtension from '../extensions/openapi-completion';
import convertFile from '../extensions/yamlJsonConverter';
import { OpenAPISource } from '../OpenAPI-source';
import { SourceController } from './source-controller';

const create: (v: EditorView) => { dom: HTMLDivElement } = (v: EditorView) => {
    const dom = document.createElement('div');
    return { dom };
};

let fontSize = 16;
const tooltip = document.createElement('div');
tooltip.addClass('openapi-renderer-source-tooltip');
document.body.appendChild(tooltip);

function updateTooltip(x: number, y: number, fontSize: number): void {
    tooltip.textContent = `Font Size: ${fontSize}px`;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.display = 'block';
}

function changeFontSize(view: EditorView, delta: number): void {
    fontSize = Math.max(10, fontSize + delta);
    view.dom.style.fontSize = `${fontSize}px`;

    updateTooltip(
        view.dom.getBoundingClientRect().right - 100,
        view.dom.getBoundingClientRect().top + 10,
        fontSize
    );
}

function handleEditorMouseEvents() {
    let timeout: NodeJS.Timeout | null = null;
    return function (event: WheelEvent, view: EditorView): void {
        if (event.ctrlKey) {
            const delta = event.deltaY > 0 ? -1 : 1;
            changeFontSize(view, delta);
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                tooltip.style.display = 'none';
                timeout = null;
            }, 2000);
        }
    };
}

const syncAnnotation = Annotation.define<boolean>();

function onChange(editorView: OpenAPISource, update: ViewUpdate): void {
    if (!update.transactions.some((tr) => tr.annotation(syncAnnotation))) {
        document.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 's',
                code: 'KeyS',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
                composed: true,
            })
        );

        const openApiGroupedLeaves =
            editorView.plugin.app.workspace.getGroupLeaves(
                'openapi-renderer-view-group'
            );

        for (const leaf of openApiGroupedLeaves) {
            if (leaf !== editorView.view.leaf) {
                const view = leaf.view as OpenAPIView;

                const editor = view.source.editor;

                editor.dispatch({
                    changes: update.changes,
                    annotations: syncAnnotation.of(true),
                });

                view.setViewData(editor.state.doc.toString(), false);
            }
            editorView.plugin.publisher.publish({
                eventID: eventID.EditorChanged,
                timestamp: new Date(),
                emitter: editorView.plugin.app.workspace,
                data: {
                    leaf: leaf,
                },
            } as EditorChangedEvent);
        }
    }
}

function handleScroll(editorView: OpenAPISource, event: Event): void {
    const groupedLeaves = editorView.plugin.app.workspace.getGroupLeaves(
        'openapi-renderer-view-group'
    );
    const target = event.target as HTMLElement;

    const { scrollTop: top, scrollLeft: left } = target;

    const scrollAxis = target.hasClass('view-content') ? 'top' : 'left';

    for (const leaf of groupedLeaves) {
        if (leaf === editorView.view.leaf) {
            continue;
        }
        const view = leaf.view as OpenAPIView;

        if (view.mode === 'preview') {
            continue;
        }
        if (scrollAxis === 'top') {
            view.contentEl.scrollTop = top;
        } else {
            view.source.editor.scrollDOM.scrollLeft = left;
        }
    }
}

export class SourceUtils {
    static createExtensions(
        editor: OpenAPISource
    ): ({ extension: Extension } | readonly Extension[] | LanguageSupport)[] {
        const boundWheelHandler = handleEditorMouseEvents();
        return [
            editor.controller.themeManager.themeConfigurator.of(
                editor.currentTheme
            ),
            editor.languageExtension(),
            EditorView.updateListener.of((update: ViewUpdate) => {
                if (update.docChanged) {
                    onChange(editor, update);
                }
            }),
            EditorView.domEventHandlers({
                wheel(event, view) {
                    boundWheelHandler(event, view);
                    return false;
                },
                scroll(event, view) {
                    handleScroll(editor, event);
                    return false;
                },
            }),
            closeBrackets(),
            yamlJsonLinter,
            foldGutter(),
            bracketMatching(),
            lintGutter(),
            highlightSelectionMatches(),
            OpenAPICompletionExtension,
            linkHighlightExtension,
            highlightActiveLine(),
            syntaxHighlighting(defaultHighlightStyle),
            keymap.of(createBoundKeymap(editor)),
            indentOnInput(),
            history({}),
            lineNumbers({
                formatNumber: (lineNo) => `${lineNo}`,
                domEventHandlers: {
                    click: (editorView, line, event) => {
                        editorView.dispatch({
                            selection: { anchor: line.from },
                            scrollIntoView: true,
                        });
                        editorView.focus();
                        return true;
                    },
                },
            }),
            EditorState.tabSize.of(4),
            EditorState.readOnly.of(false),
        ];
    }

    static setupEventListeners(controller: SourceController): void {
        const { settings } = controller.editor.plugin;
        controller.editor.view.app.workspace.on('css-change', () => {
            if (settings.syncOpenAPISourceTheme) {
                controller.editor.controller.themeManager.syncWithObsidian();
            }
        });

        controller.editor.view.plugin.observer.subscribe(
            controller.editor.view.plugin.app.workspace,
            eventID.SourceThemeState,
            async () => {
                if (settings.syncOpenAPISourceTheme) {
                    controller.themeManager.syncWithObsidian();
                } else {
                    const mode = settings.OpenAPISourceThemeMode;
                    const theme =
                        controller.themeManager.getEditorCurrentThemeByMode(
                            mode
                        );
                    if (theme) {
                        controller.editor.currentThemeMode = mode;
                        controller.editor.currentTheme = theme;
                        controller.themeManager.requestSourceThemeChange();
                    }
                }
            }
        );
    }

    static initializeEditor(controller: SourceController): void {
        const file = controller.editor.view.file;
        if (!file) {
            return;
        }
        const isJson = file.extension === 'json';
        controller.editor.languageExtension = isJson ? json : yaml;

        controller.editor.editor = new EditorView({
            state: EditorState.create({
                doc: controller.editor.view.data,
                extensions: SourceUtils.createExtensions(controller.editor),
            }),
            parent: controller.editor.contentEl,
        });
    }

    static initializeActions(controller: SourceController): void {
        const { app, plugin } = controller.editor.view;
        const { view } = controller.editor;

        const themeButton = view.addAction(
            controller.themeManager.getThemeButtonIcon(),
            'Theme',
            (ev: MouseEvent) => {
                controller.themeManager.toggleThemeManually();
                controller.themeManager.requestSourceThemeChange();
                setIcon(
                    themeButton,
                    controller.themeManager.getThemeButtonIcon()
                );
            }
        );

        plugin.observer.subscribe(
            app.workspace,
            eventID.SourceThemeState,
            async () =>
                setIcon(
                    themeButton,
                    controller.themeManager.getThemeButtonIcon()
                )
        );

        const convertButton = view.addAction(
            'arrow-right-left',
            'Convert File between JSON and YAML',
            convertFile(controller.editor.view, controller.editor)
        );

        const formatButton = view.addAction(
            'code',
            'Format',
            openAPIFormatter(controller.editor)
        );

        plugin.observer.subscribe(
            app.workspace,
            eventID.SwitchModeState,
            async (event: SwitchModeStateEvent) => {
                const leaf = event.data.leaf;
                if (leaf === controller.editor.view.leaf) {
                    themeButton.remove();
                    convertButton.remove();
                    formatButton.remove();
                }
            }
        );
    }
}
