import { IosPlist } from '@expo/xdl';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import spawnAsync from '@expo/spawn-async';

import { runExpoCliAsync } from '../ExpoCLI';

type Action = {
  platform: 'android' | 'ios';
  name: string;
};

async function action({ platform, name }: Action) {
  // eslint-disable-next-line
  const examplesRoot = path.resolve(__dirname, '../../../examples');

  const projectName = `${name}-stories`;
  const xcodeProjectName = projectName.split('-').join('');
  console.log({ xcodeProjectName });

  // TODO - flag to toggle this rebuild from scratch
  const projectRoot = path.resolve(examplesRoot, projectName);
  if (fs.existsSync(projectRoot)) {
    // @ts-ignore
    fs.rmdirSync(projectRoot, { recursive: true, force: true });
  }

  console.log({ examplesRoot });

  // 1. initialize expo project w/ name
  await runExpoCliAsync('init', [projectName, '-t', 'bare-minimum', '--no-install'], {
    cwd: examplesRoot,
  });

  // 2. run expo prebuild on project
  await runExpoCliAsync('prebuild', [], { cwd: projectRoot });

  // 3. copy over template files for project

  // eslint-disable-next-line
  const templateRoot = path.resolve(__dirname, '../../../template-files/stories-templates');

  // metro config
  const metroConfigPath = path.resolve(templateRoot, 'metro.config.js');
  fs.copyFileSync(metroConfigPath, path.resolve(projectRoot, 'metro.config.js'));

  // package.json
  // eslint-disable-next-line
  const packageRoot = path.resolve(__dirname, '../../../packages', name);
  const defaultPkg = require(path.resolve(templateRoot, 'pkg.json'));
  const projectPkg = require(path.resolve(projectRoot, 'package.json'));

  const mergedPkg = {
    ...projectPkg,
    ...defaultPkg,
  };

  mergedPkg.expoStories = {
    projectRoot,
    watchRoot: packageRoot,
  };

  console.log({ defaultPkg, projectPkg, mergedPkg });

  fs.writeFileSync(
    path.resolve(projectRoot, 'package.json'),
    JSON.stringify(mergedPkg, null, '\t')
  );

  // appdelegate.{h,m}
  const iosRoot = path.resolve(projectRoot, 'ios', xcodeProjectName);

  fs.copyFileSync(
    path.resolve(templateRoot, 'ios/AppDelegate.h'),
    path.resolve(iosRoot, 'AppDelegate.h')
  );

  fs.copyFileSync(
    path.resolve(templateRoot, 'ios/AppDelegate.m'),
    path.resolve(iosRoot, 'AppDelegate.m')
  );

  // podfile
  const podfileRoot = path.resolve(projectRoot, 'ios/Podfile');

  fs.copyFileSync(path.resolve(templateRoot, 'ios/Podfile'), podfileRoot);

  // update target
  let podFileStr = fs.readFileSync(podfileRoot, { encoding: 'utf-8' });
  podFileStr = podFileStr.replace('{{ targetName }}', xcodeProjectName);

  fs.writeFileSync(path.resolve(projectRoot, 'ios/Podfile'), podFileStr, { encoding: 'utf-8' });

  // info.plist -> add splash screen
  IosPlist.modifyAsync(iosRoot, 'Info', config => {
    console.log({ config });
    config['UILaunchStoryboardName'] = 'SplashScreen';
    return config;
  });

  // .watchmanconfig
  fs.writeFileSync(path.resolve(projectRoot, '.watchmanconfig'), '{}', { encoding: 'utf-8' });
  fs.copyFileSync(path.resolve(templateRoot, 'App.js'), path.resolve(projectRoot, 'App.js'));

  // 4. yarn / install deps
  await spawnAsync('yarn', ['install'], { cwd: projectRoot });

  // remove .git directory - seems to help with watchman and fast refresh??
  // figure this one out - doesnt seem to help
  // @ts-ignore
  // fs.rmdirSync(path.resolve(projectRoot, '.git'), { force: true, recursiv/e: true });

  // process.chdir(projectRoot);
  // await runExpoCliAsync('run:ios', [], { cwd: projectRoot });

  // NEXT:
  // 6. update package w/ required modules (e.g cocoapods)
  // 7. start stories server
}

export default (program: any) => {
  program
    .command('run-examples')
    .option('-p, --platform <string>', 'Determine for which platform we should run')
    .option('-n, --name <string>', 'The name of the package')
    .asyncAction(action);
};
