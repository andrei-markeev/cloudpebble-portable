// @ts-check
var IntellisenseHelper = (function () {
    function IntellisenseHelper(typeScriptService, editor) {
        var _this = this;
        this.tooltipLastPos = { line: -1, ch: -1 };
        this.fieldNames = [];
        this.typeScriptService = typeScriptService;
        editor.on("cursorActivity", function (cm) {
            if (cm.getDoc().getCursor().line != _this.tooltipLastPos.line || cm.getDoc().getCursor().ch < _this.tooltipLastPos.ch) {
                $('.tooltip').remove();
            }
        });
    }
    IntellisenseHelper.prototype.setFieldInternalNames = function (fieldNames) {
        this.fieldNames = fieldNames;
    };
    IntellisenseHelper.prototype.joinParts = function (displayParts) {
        if (displayParts)
            return displayParts.map(function (p) { return p.kind == "punctuation" || p.kind == "space" ? p.text : "<span class=\"" + p.kind + "\">" + p.text + "</span>"; }).join("").replace('\n', '<br/>');
        else
            return '';
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
                var tooltip;
                CodeMirror.on(completionInfo, "select", function (completion, element) {
                    $('.tooltip').remove();
                    if (!completion.typeInfo && completion.pos) {
                        var details = _this.typeScriptService.getCompletionDetails(filePath, completion.pos, completion.text);
                        completion.typeInfo = _this.joinParts(details.displayParts);
                        completion.docComment = _this.joinParts(details.documentation);
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
        var list = [];
        for (var i = 0; i < completions.entries.length; i++) {
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
        var signatures = this.typeScriptService.getSignature(filePath, changePosition);
        if (signatures && signatures.items && signatures.selectedItemIndex >= 0) {
            var signature = signatures.items[signatures.selectedItemIndex];
            var paramsString = signature.parameters
                .map(function (p) { return _this.joinParts(p.displayParts); })
                .join(this.joinParts(signature.separatorDisplayParts));
            var signatureString = this.joinParts(signature.prefixDisplayParts) + paramsString + this.joinParts(signature.suffixDisplayParts);
            this.tooltipLastPos = cm.getCursor();
            var cursorCoords = cm.cursorCoords(cm.getCursor(), "page");
            var domElement = cm.getWrapperElement();
            $(domElement).tooltip({
                animation: false,
                html: true,
                title: '<div class="tooltip-typeInfo">' + signatureString + '</div>' + '<div class="tooltip-docComment">' + this.joinParts(signature.documentation) + '</div>',
                trigger: 'manual', container: 'body', placement: 'bottom'
            });
            $(domElement).off('shown').on('shown', function () {
                $('.tooltip').css('position', 'absolute').css('z-index', 2).css('top', cursorCoords.bottom + "px").css('left', cursorCoords.left + "px");
            });
            $(domElement).tooltip('show');
        }
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
        this.scripts = ['libs.ts', filePath];
    }
    TypeScriptServiceHost.prototype.log = function (message) { console.log("tsHost: " + message); };
    TypeScriptServiceHost.prototype.getCompilationSettings = function () { return { target: ts.ScriptTarget.ES6, allowJs: true }; };
    TypeScriptServiceHost.prototype.getScriptFileNames = function () { return this.scripts; };
    TypeScriptServiceHost.prototype.getScriptVersion = function (fn) { return (this.scriptVersion[fn] || 0).toString(); };
    TypeScriptServiceHost.prototype.getScriptSnapshot = function (fn) {
        if (fn == 'libs.ts')
            return ts.ScriptSnapshot.fromString(this.libText);
        else
            return ts.ScriptSnapshot.fromString(this.text[fn]);
    };
    TypeScriptServiceHost.prototype.getCurrentDirectory = function () { return ""; };
    TypeScriptServiceHost.prototype.getDefaultLibFileName = function () { return "libs.ts"; };
    TypeScriptServiceHost.prototype.scriptChanged = function (fn, newText, startPos, changeLength) {
        if (startPos === void 0) { startPos = 0; }
        if (changeLength === void 0) { changeLength = 0; }
        this.scriptVersion[fn]++;
        this.text[fn] = newText;
        if (startPos > 0 || changeLength > 0)
            this.changes[fn].push(ts.createTextChangeRange(ts.createTextSpan(startPos, changeLength), newText.length));
    };
    TypeScriptServiceHost.prototype.addFile = function (fn) { this.scripts.push(fn) };
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

function ActivateJsService(cm, filePath) {

    filePath = filePath.replace(/\.js$/, '.ts')

    if (!JsService.ready) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/data/libs.d.ts');
        xhr.onreadystatechange = function () {
            if (xhr.readyState != 4)
                return;
            JsService.host = new TypeScriptServiceHost(xhr.responseText, filePath, cm.getValue());
            var tsService = ts.createLanguageService(JsService.host, ts.createDocumentRegistry());
            JsService.typeScriptService = new TypeScriptService(JsService.host, tsService);
            JsService.intellisenseHelper = new IntellisenseHelper(JsService.typeScriptService, cm);
            checkSyntax(cm);
            cm.on("change", processChanges)
        };
        xhr.send();
    } else {
        JsService.host.addFile(filePath, cm.getValue());
        checkSyntax(cm);
        cm.on("change", processChanges)
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
                    var texts = [];
                    while (chain.next) {
                        texts.push(chain.messageText);
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