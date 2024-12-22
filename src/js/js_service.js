// @ts-check
var IntellisenseHelper = (function () {
    function IntellisenseHelper(typeScriptService, editor) {
        var _this = this;
        this.tooltipLastPos = { line: -1, ch: -1 };
        this.typeScriptService = typeScriptService;
        this.overloads = null;
        editor.on("cursorActivity", function (cm) {
            if (cm.getDoc().getCursor().line != _this.tooltipLastPos.line || cm.getDoc().getCursor().ch < _this.tooltipLastPos.ch) {
                $('.tooltip').remove();
                _this.overloads = null;
            }
        });

        function updateTooltip() {
            var details = _this.overloads[_this.selectedOverloadIndex];
            var domElement = editor.getWrapperElement();
            $(domElement)
                .attr('title', '<div class="overloads-label">(' + (_this.selectedOverloadIndex + 1) + '/' + _this.overloads.length + ')</div>'
                    + '<div class="tooltip-typeInfo">' + details.signatureString + '</div>' 
                    + '<div class="tooltip-docComment">' + details.documentation + '</div>')
                .tooltip('fixTitle')
                .tooltip('show');
        }

        editor.setOption("extraKeys", {
            "Up": function() {
                console.log("Key Up pressed");
                if (!_this.overloads)
                    return CodeMirror.Pass;
                if (_this.selectedOverloadIndex <= 0)
                    return;

                _this.selectedOverloadIndex--;
                updateTooltip();
            },
            "Down": function() {
                console.log("Key Down pressed");
                if (!_this.overloads)
                    return CodeMirror.Pass;
                if (_this.selectedOverloadIndex >= _this.overloads.length - 1)
                    return;

                _this.selectedOverloadIndex++;
                updateTooltip();
            },
            "Esc": function() {
                if (!_this.overloads)
                    return CodeMirror.PASS;

                $('.tooltip').remove();
                _this.overloads = null;
            },
            "F12": function() {
                var cur = editor.getCursor();
                var index = editor.indexFromPos(cur);
                var filePath = editor.file_path;
                var definitions = _this.typeScriptService.tsService.getDefinitionAtPosition(filePath, index);
                if (definitions && definitions.length > 0) {
                    if (definitions[0].fileName === filePath) {
                        var definitionPos = editor.posFromIndex(definitions[0].textSpan.start);
                        if (definitions[0].kind == 'function')
                            definitionPos.ch += 9;

                        editor.setCursor(definitionPos);

                        if (cur.line < definitionPos.line) {
                            editor.scrollIntoView({ line: Math.min(definitionPos.line + 20, editor.lineCount() - 1), ch: 0 });
                        }
                    } else {
                        // TODO: jumping to other files
                    }
                }
            },
            "Ctrl-Space": function() {
                var filePath = editor.file_path;
                _this.showAutoCompleteDropDown(filePath, editor, editor.indexFromPos(editor.getCursor()) + 1);
            }
        });
    }
    IntellisenseHelper.prototype.joinParts = function (displayParts, enableMarkdown) {
        var html = '';
        if (displayParts) {
            html = displayParts
                .map(function (p) {
                    if (p.kind === 'lineBreak')
                        return '<br />';
                    if (p.kind === "punctuation" || p.kind === "space")
                        return p.text;
                    return "<span class=\"" + p.kind + "\">" + p.text + "</span>";
                }).join("");
            // TODO: support more markdown syntax
            if (enableMarkdown)
                html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
                    .replace(/\[([^\]]+)\]\((https?:\/\/[A-Za-z0-9_\?\-\/\.]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        }
        return html;
    };
    IntellisenseHelper.prototype.showCodeMirrorHint = function (filePath, cm, list) {
        var _this = this;
        list.sort(function (l, r) {
            if (l.displayText > r.displayText)
                return 1;
            if (l.displayText < r.displayText)
                return -1;
            return 0;
        });
        cm.showHint({
            completeSingle: false,
            hint: function (cm) {
                var cur = cm.getCursor();
                var token = cm.getTokenAt(cur);
                var completionInfo = null;
                var show_words = [];
                if (token.string == ".") {
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].livePreview == false)
                            show_words.push(list[i]);
                    }
                    completionInfo = { from: cur, to: cur, list: show_words };
                }
                else if (token.string == "," || token.string == "(") {
                    completionInfo = { from: cur, to: cur, list: list };
                }
                else {
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].text.toLowerCase().indexOf(token.string.toLowerCase().replace(/\"$/, '')) > -1)
                            show_words.push(list[i]);
                    }
                    completionInfo = {
                        from: { line: cur.line, ch: token.start },
                        to: { line: cur.line, ch: token.end },
                        list: show_words
                    };
                }
                CodeMirror.on(completionInfo, "select", function (completion, element) {
                    $('.tooltip').remove();
                    _this.overloads = null;
                    if (!completion.typeInfo && completion.pos) {
                        var details = _this.typeScriptService.getCompletionDetails(filePath, completion.pos, completion.text);
                        completion.typeInfo = _this.joinParts(details.displayParts);
                        completion.docComment = _this.joinParts(details.documentation, true);
                    }
                    if (completion.typeInfo) {
                        $(element).tooltip({
                            animation: false,
                            html: true,
                            title: '<div class="tooltip-typeInfo">' + completion.typeInfo + '</div>' + '<div class="tooltip-docComment">' + completion.docComment.replace('\n', '<br/>') + '</div>',
                            trigger: 'manual',
                            container: 'body',
                            placement: 'right'
                        });
                        $(element).off('shown').on('shown', function () {
                            $('.tooltip').css('z-index', 2);
                        });
                        $(element).tooltip('show');
                    }
                });
                CodeMirror.on(completionInfo, "close", function () {
                    $('.tooltip').remove();
                    _this.overloads = null;
                });
                return completionInfo;
            }
        });
    };
    IntellisenseHelper.prototype.showAutoCompleteDropDown = function (filePath, cm, changePosition) {
        var completions = this.typeScriptService.getCompletions(filePath, changePosition);
        if (completions == null)
            return;
        $('.tooltip').remove();
        this.overloads = null;
        var list = [];
        for (var i = 0; i < completions.entries.length; i++) {
            if (completions.entries[i].kind === "warning" && completions.entries[i].sortText === "1")
                continue;
            if (completions.entries[i].kind === "interface")
                continue;
            if (completions.entries[i].kind === "keyword")
                continue;
            list.push({
                text: completions.entries[i].name,
                displayText: completions.entries[i].name,
                kind: completions.entries[i].kind,
                pos: changePosition,
                livePreview: false
            });
        }
        this.showCodeMirrorHint(filePath, cm, list);
    };
    IntellisenseHelper.prototype.showFunctionTooltip = function (filePath, cm, changePosition) {
        var _this = this;
        $('.tooltip').remove();
        this.overloads = null;
        var signatures = this.typeScriptService.getSignature(filePath, changePosition);
        if (signatures && signatures.items && signatures.selectedItemIndex >= 0) {
            var overloads = [];
            for (var i = 0; i < signatures.items.length; i++) {
                var overload = {};
                var signature = signatures.items[i];
                var paramsString = signature.parameters
                    .map(function (p) { return _this.joinParts(p.displayParts); })
                    .join(this.joinParts(signature.separatorDisplayParts));
                overload.signatureString = this.joinParts(signature.prefixDisplayParts) + paramsString + this.joinParts(signature.suffixDisplayParts);
                overload.documentation = this.joinParts(signature.documentation, true)
                overloads.push(overload);
            }

            var overloadsSidebar = overloads.length > 1 ? '<div class="overloads-label">(' + (signatures.selectedItemIndex + 1) + '/' + overloads.length + ')</div>' : '';
    
            var selectedOverload = overloads[signatures.selectedItemIndex];
            this.tooltipLastPos = cm.getCursor();
            var cursorCoords = cm.cursorCoords(cm.getCursor(), "page");
            var domElement = cm.getWrapperElement();
            $(domElement)
                .tooltip({
                    animation: false,
                    html: true,
                    trigger: 'manual', container: 'body', placement: 'bottom'
                })
                .attr('title', overloadsSidebar
                    + '<div class="tooltip-typeInfo">' + selectedOverload.signatureString + '</div>'
                    + '<div class="tooltip-docComment">' + selectedOverload.documentation + '</div>'
                )
                .tooltip('fixTitle')
                .off('shown')
                .on('shown', function () {
                    $('.tooltip').css('position', 'absolute').css('z-index', 2).css('top', cursorCoords.bottom + "px").css('left', cursorCoords.left + "px");
                })
                .tooltip('show');

            if (overloads.length > 1) {
                this.selectedOverloadIndex = signatures.selectedItemIndex;
                this.overloads = overloads;
            }
        }
    };

    IntellisenseHelper.prototype.setupHoverTooltips = function (filePath, cm) {
        var _this = this;
        var timeoutHandle = 0;
        var savedX = null, savedY = null, shown = false;
        function debounceTooltipOnHover(event) {
            if (_this.overloads)
                return;

            if (shown && (Math.abs(event.pageX - savedX) > 50 || Math.abs(event.pageY - savedY) > 50)) {
                $('.tooltip').remove();
                _this.overloads = null;
                shown = false;
            }

            if (savedX === null || Math.abs(event.pageX - savedX) > 10 || Math.abs(event.pageY - savedY) > 10) {
                savedX = event.pageX;
                savedY = event.pageY;

                if (timeoutHandle)
                    clearTimeout(timeoutHandle);
                timeoutHandle = setTimeout(function () {
                    if (_this.overloads)
                        return;
                    var char = cm.coordsChar({left: savedX, top: savedY});
                    var marks = cm.getDoc().findMarksAt(char);
                    if (marks && marks.length > 0) {
                        $('.tooltip').remove();
                        return;
                    }
                    var index = cm.indexFromPos(char) + 1;
                    var quickInfo = _this.typeScriptService.tsService.getQuickInfoAtPosition(filePath, index);
                    if (quickInfo) {
                        $('.tooltip').remove();

                        var typeInfo = _this.joinParts(quickInfo.displayParts);
                        var documentation = _this.joinParts(quickInfo.documentation, true);
                        var domElement = cm.getWrapperElement();
                        $(domElement)
                            .tooltip({
                                animation: false,
                                html: true,
                                trigger: 'manual', container: 'body', placement: 'bottom'
                            })
                            .attr('title', '<div class="tooltip-typeInfo">' + typeInfo + '</div>'
                                + '<div class="tooltip-docComment">' + documentation + '</div>'
                            )
                            .tooltip('fixTitle')
                            .off('shown')
                            .on('shown', function () {
                                $('.tooltip').css('position', 'absolute').css('z-index', 2).css('top', (savedY + 5) + "px").css('left', savedX + "px");
                            })
                            .tooltip('show');

                        shown = true;
                    }
                }, 900);
            }

        }

        var domElement = cm.getWrapperElement();
        $(domElement).off('mousemove', debounceTooltipOnHover).on('mousemove', debounceTooltipOnHover);

        cm.on('scroll', function() {
            $('.tooltip').remove();
            _this.overloads = null;
        })
    };

    IntellisenseHelper.prototype.scriptChanged = function (filePath, cm, changeText, changePos) {
        if (changeText == '.') {
            this.showAutoCompleteDropDown(filePath, cm, changePos);
        }
        else if (changeText == '(' || changeText == ',') {
            this.showFunctionTooltip(filePath, cm, changePos);
        }
        else if (changeText == ')') {
            $('.tooltip').remove();
            this.overloads = null;
        }
    };
    return IntellisenseHelper;
}());

var TypeScriptServiceHost = (function () {
    function TypeScriptServiceHost(libText, filePath, fileText) {
        this.scriptVersion = {};
        this.text = {};
        this.changes = {};
        this.libText = libText;
        this.libTextLength = libText.length;
        this.scriptVersion[filePath] = 0;
        this.text[filePath] = fileText;
        this.changes[filePath] = [];
        this.scripts = ['libs.d.ts', filePath];
    }
    TypeScriptServiceHost.prototype.log = function (message) { console.log("tsHost: " + message); };
    TypeScriptServiceHost.prototype.getCompilationSettings = function () { return { target: ts.ScriptTarget.ES6, allowJs: true, checkJs: true }; };
    TypeScriptServiceHost.prototype.getScriptFileNames = function () { return this.scripts; };
    TypeScriptServiceHost.prototype.getScriptVersion = function (fn) { return (this.scriptVersion[fn] || 0).toString(); };
    TypeScriptServiceHost.prototype.getScriptSnapshot = function (fn) {
        if (fn == 'libs.d.ts')
            return ts.ScriptSnapshot.fromString(this.libText);
        else if (fn in this.text)
            return ts.ScriptSnapshot.fromString(this.text[fn]);
        else
            return undefined;
    };
    TypeScriptServiceHost.prototype.getCurrentDirectory = function () { return ""; };
    TypeScriptServiceHost.prototype.getDefaultLibFileName = function () { return "libs.d.ts"; };
    TypeScriptServiceHost.prototype.scriptChanged = function (fn, newText, startPos, changeLength) {
        if (startPos === void 0) { startPos = 0; }
        if (changeLength === void 0) { changeLength = 0; }
        this.scriptVersion[fn]++;
        this.text[fn] = newText;
        if (startPos > 0 || changeLength > 0)
            this.changes[fn].push(ts.createTextChangeRange(ts.createTextSpan(startPos, changeLength), newText.length));
    };
    TypeScriptServiceHost.prototype.addFile = function (fn, fileText) {
        this.scripts.push(fn);
        this.scriptVersion[fn] = 0;
        this.text[fn] = fileText;
        this.changes[fn] = [];
    };
    return TypeScriptServiceHost;
}());

var TypeScriptService = (function () {
    function TypeScriptService(tsHost, tsService) {
        this.tsHost = tsHost;
        this.tsService = tsService;
    }
    TypeScriptService.prototype.scriptChanged = function (filePath, newText, startPos, changeLength) {
        this.tsHost.scriptChanged(filePath, newText, startPos, changeLength);
    };
    TypeScriptService.prototype.getSymbolInfo = function (filePath, position) {
        return this.tsService.getEncodedSemanticClassifications(filePath, position);
    };
    TypeScriptService.prototype.getCompletions = function (filePath, position) {
        return this.tsService.getCompletionsAtPosition(filePath, position);
    };
    TypeScriptService.prototype.getCompletionDetails = function (filePath, position, name) {
        return this.tsService.getCompletionEntryDetails(filePath, position, name);
    };
    TypeScriptService.prototype.getSignature = function (filePath, position) {
        return this.tsService.getSignatureHelpItems(filePath, position);
    };
    TypeScriptService.prototype.getErrors = function (filePath) {
        var syntastic = this.tsService.getSyntacticDiagnostics(filePath);
        var semantic = this.tsService.getSemanticDiagnostics(filePath);
        return syntastic.concat(semantic);
    };
    TypeScriptService.prototype.getJs = function (filePath) {
        return this.tsService.getEmitOutput(filePath).outputFiles[0].text;
    };
    return TypeScriptService;
}());

var JsService = {
    ready: false,
    host: null,
    typeScriptService: null,
    intellisenseHelper: null
};

function getFile(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onreadystatechange = function () {
            if (xhr.readyState != 4)
                return;
            resolve(xhr.responseText);
        };
        xhr.onerror = function(e) { reject(e) };
        xhr.send();
    });
}

async function ActivateJsService(cm, filePath) {

    if (!JsService.ready) {
        var libText = await getFile('/data/libs.d.ts');
        JsService.host = new TypeScriptServiceHost(libText, filePath, cm.getValue());
        if (CloudPebble.ProjectInfo.type === 'pebblejs') {
            var pebbleJsLibText = await getFile('/data/pebblejs.d.ts');
            JsService.host.addFile('pebblejs.d.ts', pebbleJsLibText);
        }
        var tsService = ts.createLanguageService(JsService.host, ts.createDocumentRegistry());
        JsService.typeScriptService = new TypeScriptService(JsService.host, tsService);
        JsService.intellisenseHelper = new IntellisenseHelper(JsService.typeScriptService, cm);
        checkSyntax(cm);
        cm.on("change", processChanges)
        JsService.intellisenseHelper.setupHoverTooltips(filePath, cm);
    } else {
        JsService.host.addFile(filePath, cm.getValue());
        checkSyntax(cm);
        cm.on("change", processChanges)
        JsService.intellisenseHelper.setupHoverTooltips(filePath, cm);
    }

    function processChanges(cm, changeObj) {
        if (!changeObj)
            return;
        JsService.typeScriptService.scriptChanged(filePath, cm.getValue(), cm.indexFromPos(changeObj.from), cm.indexFromPos(changeObj.to) - cm.indexFromPos(changeObj.from));
        if (changeObj.text.length == 1)
            JsService.intellisenseHelper.scriptChanged(filePath, cm, changeObj.text[0], cm.indexFromPos(changeObj.to) + 1);
        checkSyntax(cm);
    };
    function checkSyntax(cm) {
        var allMarkers = cm.getAllMarks();
        for (var i = 0; i < allMarkers.length; i++) {
            allMarkers[i].clear();
        }
        if (checkSyntaxTimeout)
            clearTimeout(checkSyntaxTimeout);
        checkSyntaxTimeout = setTimeout(function () {
            var errors = JsService.typeScriptService.getErrors(filePath);
            for (var i = 0; i < errors.length; i++) {
                var text = "";
                if (typeof errors[i].messageText == "string")
                    text = errors[i].messageText;
                else {
                    var chain = errors[i].messageText;
                    var texts = [chain.messageText];
                    while (chain.next) {
                        texts.push(chain.next.messageText);
                        chain = chain.next;
                    }
                    text = texts.join('\n  ');
                }
                var start = errors[i].start;
                var end = errors[i].start + errors[i].length;
                if (start != -1 && end != -1)
                    cm.markText(cm.posFromIndex(start), cm.posFromIndex(end), {
                        className: "syntax-error",
                        title: text
                    });
            }
        }, 1500);
    };
    var checkSyntaxTimeout = 0;
}