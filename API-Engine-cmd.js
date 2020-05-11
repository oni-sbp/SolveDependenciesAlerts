const requestInfo = require('./utils/RequestInfo')
const info = require('./conf/info')
const codeGenerator = require('./generation/code-generator')
const runShellCommand = require('./utils/run-command').runShellCommand
const args = require('minimist')(process.argv.slice(2))
const validator = require('./validation/code-validator')
const shelljs = require('shelljs')
const Config = require('./conf/conf').Config

info.commandLine = true

args.input = absolute(process.cwd().replace(/\\/g, '/'), args.input)

requestInfo.createRequest().then((request) => {
  request.createRequestFolder()
  request.saveInfoFromArgs(args)
  request.setLanguages()

  request.conf = new Config()
  if (args.config) {
    request.conf.loadConfigFile(request, args.config)
  }

  request.totalArchives = 0
  request.finnishCount = 0

  codeGenerator.generateSamples(request).then(() => {
    codeGenerator.generateDocs(request)

    validator.validateGeneratedSamples(request)
    setTimeout(check, 100, request)
  })
})

function copyFilesAndFolders (request) {
  shelljs.mkdir('-p', request.pathToDocs)
  runShellCommand('mkdir "' + request.getDocsBuild() + '/specs"', 20, process.cwd())
  runShellCommand('mkdir "' + request.getDocsBuild() + '/specs/raml"', 20, process.cwd())
  runShellCommand('mkdir "' + request.getDocsBuild() + '/specs/oas"', 20, process.cwd())

  if (info.onWindows) {
    runShellCommand('XCOPY /E "' + request.getArchivesFolder() + '." "' + request.getDocsBuild() + '/specs/raml"', 20, process.cwd())
    runShellCommand('XCOPY /E "' + request.getOASFolder() + '." "' + request.getDocsBuild() + '/specs/oas"', 20, process.cwd())
    runShellCommand('XCOPY /E "' + request.getDocsBuild() + '" "' + request.pathToDocs + '"', 20, process.cwd())
  } else {
    runShellCommand('cp -r "' + request.getArchivesFolder() + '." "' + request.getDocsBuild() + '/specs/raml"', 20, process.cwd())
    runShellCommand('cp -r "' + request.getOASFolder() + '." "' + request.getDocsBuild() + '/specs/oas"', 20, process.cwd())
    runShellCommand('cp -r "' + request.getDocsBuild() + '" "' + request.pathToDocs + '"', 20, process.cwd())
  }
}

async function check (request) {
  if (request.totalArchives === request.finnishCount) {
    copyFilesAndFolders(request)
  } else {
    setTimeout(check, 100, request)
  }
}

function absolute (base, relative) {
  var stack = base.split('/')
  var parts = relative.split('/')

  for (var i = 0; i < parts.length; i++) {
    if (parts[i] === '.') { continue }
    if (parts[i] === '..') { stack.pop() } else { stack.push(parts[i]) }
  }
  return stack.join('/')
}
