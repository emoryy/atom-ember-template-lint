'use babel'

const Linter = require('ember-template-lint');
const loophole = require('loophole');
const LinterHelpers = require('atom-linter');
const { File, Directory } = require('atom');

const configFileName = ".template-lintrc.js";

function getConfigFileFromDirectory(directory) {
  return directory.getEntriesSync().find(function(entry) {
    return entry.isFile() && entry.getBaseName() === configFileName;
  });
}

function findConfigFileForFilePath(editorFilePath) {
  let currentDir = new File(editorFilePath).getParent();
  let foundConfig;
  while (!(foundConfig = getConfigFileFromDirectory(currentDir)) && !currentDir.isRoot()) {
    currentDir = currentDir.getParent();
  }
  return foundConfig && foundConfig.getPath();
}

export function activate() {
  require('atom-package-deps').install('atom-ember-template-lint');
}

export function provideLinter() {
  return {
      name: 'Ember Template Linter',
      grammarScopes: [
        'text.html.mustache',
        'text.html.htmlbars',
        'text.html.handlebars'
      ],
      scope: 'file', // or 'project'
      lintsOnChange: true,
      lint: function(textEditor) {
        return new Promise(function(resolve, reject) {
          const options = {
            configPath: findConfigFileForFilePath(textEditor.getPath())
          };
          const linter = new Linter(options);

          let linterErrors = [];

          loophole.allowUnsafeNewFunction(() => {
            linterErrors = linter.verify({
              source: textEditor.getText(),
              moduleId: textEditor.getPath().slice(0, -4)
            });
          });
          const errors = linterErrors.map(
            (error) => ({
              location: {
                file: textEditor.getPath(),
                position: LinterHelpers.generateRange(textEditor, error.line - 1, error.column)
              },
              severity: 'error',
              excerpt: error.message,
              description: error.rule
            })
          );

          resolve(errors);
        })
      }
    }
}
