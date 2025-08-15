import { ChildProcess, spawn } from 'child_process';
import { app } from 'electron';
import { log } from '../utils/log';
import { nestBrowser } from './nest-browser';
import { existsSync, writeFileSync } from 'fs';
import { normalize, join } from 'path';
import {
  DEFAULT_PLUGINS_AUTOJS_APK,
  DEFAULT_PLUGINS_NESTBROWSER_APK,
  DEFAULT_SYNC_COOKIE_USERAGENT,
} from '~/constants/common';
//import { extDownloadFiles } from '../utils/helper';
import { exec } from 'child_process';

const autojs_packageName = 'org.autojs.autojs6';
const chrome_packageName = 'com.kiwibrowser.browser';

const webview_shell_packageName = 'org.chromium.webview_shell';
const via_browser_packageName = 'mark.via.gp';


interface MGC_ARGS {
  time: number; // TypeScript中没有int32，但number可以代表整数
  group: number;
  port: number;
  len: number;
  serial: string; // TypeScript中没有char*，这里使用string代替
}

export class NestAdb {
  //构造函数
  public constructor() {
    log.debug('NestAdb constructor');
  }

  public async syncCookies(host: any, port: any, id: any, cookie: any) {
    //一系列的adb命令
    /*
    adb shell cd /data/local/tmp/
    adb shell mkdir -p /data/local/tmp/

    //把cookie文件放到指定目录
    adb push D:\AndroidProject\autojs-fb-cookie\Python_Cookie_2_Header\cookie.txt /data/local/tmp/
    //把UserAgent文件放到指定目录
    adb push D:\AndroidProject\autojs-fb-cookie\Python_Cookie_2_Header\UserAgent.txt /data/local/tmp/

    adb shell chmod 777 /data/local/tmp/cookie.txt
    adb shell chmod 777 /data/local/tmp/UserAgent.txt

    adb install -g D:\AndroidProject\ApkTool\NestBrowser.apk
    adb install -g D:\AndroidProject\ApkTool\autojs.apk

    adb shell settings put secure enabled_accessibility_services org.autojs.autojs6/org.autojs.autojs.core.accessibility.AccessibilityServiceUsher
    adb shell settings put secure accessibility_enabled 1
    adb shell pm grant org.autojs.autojs6 android.permission.WRITE_SECURE_SETTINGS
    adb shell pm grant org.autojs.autojs6 android.permission.SYSTEM_ALERT_WINDOW
    adb shell pm grant org.autojs.autojs6 android.permission.READ_EXTERNAL_STORAGE
    adb shell pm grant org.autojs.autojs6 android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS

    adb shell am force-stop com.kiwibrowser.browser
    adb shell am force-stop org.autojs.autojs6
    adb shell am start -W -n org.autojs.autojs6/org.autojs.autojs.inrt.SplashActivity 
    */
    let out = false;
    let nstep = 0;
    do {
      const url = `${host}:${port}`;
      let bres = await this.connectAdb(url);
      if (!bres) {
        nstep = 1;
        break;
      }

      let args = [];
      args.push('cd');
      args.push('/data/local/tmp/');
      let res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 2;
        break;
      }

      args = [];
      args.push('mkdir');
      args.push('-p');
      args.push('/data/local/tmp/');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 3;
        break;
      }

      const cookieFile = normalize(
        join(app.getPath('userData'), 'temp', 'cookies.txt'),
      );
      writeFileSync(cookieFile, Buffer.from(cookie, 'base64').toString());
      args = [];
      args.push(cookieFile);
      args.push('/data/local/tmp/');
      res = await this.pushFile(url, args);
      if (res === '') {
        nstep = 4;
        break;
      }

      const userAgentFile = normalize(
        join(app.getPath('userData'), 'temp', 'UserAgent.txt'),
      );
      if (!existsSync(userAgentFile)) {
        writeFileSync(userAgentFile, DEFAULT_SYNC_COOKIE_USERAGENT);
      }
      args = [];
      args.push(userAgentFile);
      args.push('/data/local/tmp/');
      res = await this.pushFile(url, args);
      if (res === '') {
        nstep = 5;
        break;
      }

      args = [];
      args.push('chmod');
      args.push('777');
      args.push('/data/local/tmp/cookies.txt');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 6;
        break;
      }

      args = [];
      args.push('chmod');
      args.push('777');
      args.push('/data/local/tmp/UserAgent.txt');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 7;
        break;
      }

      // 设置adb install不校验签名
      args = [];
      args.push('settings');
      args.push('put');
      args.push('global');
      args.push('verifier_verify_adb_installs');
      args.push('0');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 7;
        break;
      }

      args = [];
      args.push('settings');
      args.push('put');
      args.push('global');
      args.push('package_verifier_enable');
      args.push('0');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 7;
        break;
      }

      //安装autojs
      const autojs = normalize(
        join(app.getPath('userData'), 'cores', DEFAULT_PLUGINS_AUTOJS_APK),
      );
      if (!existsSync(autojs)) {
        nstep = 8;
        break;
      }
      const isAutojsInstalled = await this.checkPackageInstalled(
        url,
        autojs_packageName,
      );
      if (isAutojsInstalled) {
        //先卸载
        const uninstallResult = await this.unInstallAndCheck(
          url,
          autojs_packageName,
        );
        log.debug('卸载autojs=' + uninstallResult);
      }
      //卸载完成再安装
      bres = await this.installAndCheck(url, autojs, autojs_packageName);
      if (!bres) {
        nstep = 9;
        break;
      }

      //安装NestBrowser
      const isChromeInstalled = await this.checkPackageInstalled(
        url,
        chrome_packageName,
      );
      if (!isChromeInstalled) {
        log.debug('KIWI chrome还没有安装，开始安装');
        const nest_apk = normalize(
          join(
            app.getPath('userData'),
            'cores',
            DEFAULT_PLUGINS_NESTBROWSER_APK,
          ),
        );
        if (!existsSync(nest_apk)) {
          nstep = 10;
          break;
        }
        // bres = await this.installAPK(url, apk, false);
        bres = await this.installAndCheck(url, nest_apk, chrome_packageName);
        if (!bres) {
          nstep = 11;
          break;
        }
      } else {
        log.debug('KIWI chrome已经安装，不再安装');
      }

      args = [];
      args.push('settings');
      args.push('put');
      args.push('secure');
      args.push('enabled_accessibility_services');
      args.push(
        'org.autojs.autojs6/org.autojs.autojs.core.accessibility.AccessibilityServiceUsher',
      );
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 12;
        break;
      }

      args = [];
      args.push('settings');
      args.push('put');
      args.push('secure');
      args.push('accessibility_enabled');
      args.push('1');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 13;
        break;
      }

      args = [];
      args.push('pm');
      args.push('grant');
      args.push('org.autojs.autojs6');
      args.push('android.permission.WRITE_SECURE_SETTINGS');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 14;
        break;
      }

      args = [];
      args.push('pm');
      args.push('grant');
      args.push('org.autojs.autojs6');
      args.push('android.permission.SYSTEM_ALERT_WINDOW');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 15;
        break;
      }

      args = [];
      args.push('pm');
      args.push('grant');
      args.push('org.autojs.autojs6');
      args.push('android.permission.READ_EXTERNAL_STORAGE');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 16;
        break;
      }

      args = [];
      args.push('pm');
      args.push('clear');
      args.push('com.kiwibrowser.browser');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 17;
        break;
      }

      //1011:增加对webview_shell的是否已经安装的判断，如果安装，就disable，否则不处理
      const isWebview_Shell_Installed = await this.checkPackageInstalled(
        url,
        webview_shell_packageName,
      );
      if(isWebview_Shell_Installed){
        log.debug('isWebview_Shell is install already ======' );
        args = [];
        args.push('pm');
        args.push('disable-user');
        args.push('org.chromium.webview_shell');
        res = await this.executeShell(url, args);
        if (res === 'error') {
          nstep = 171;
          break;
        }
      }else{
        log.debug('isWebview_Shell is not install ======' );
      }


      const via_browser_Installed = await this.checkPackageInstalled(
        url,
        via_browser_packageName,
      );

      if(via_browser_Installed){
        log.debug('via browser is install already ======' );
        args = [];
        args.push('pm');
        args.push('disable-user');
        args.push('mark.via.gp');
        res = await this.executeShell(url, args);
        if (res === 'error') {
          nstep = 172;
          break;
        }
      }else{
        log.debug('via browser is not install ======' );
      }



      args = [];
      args.push('am');
      args.push('force-stop');
      args.push('org.autojs.autojs6');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 19;
        break;
      }

      args = [];
      args.push('am');
      args.push('start');
      args.push('-W');
      args.push('-n');
      args.push('org.autojs.autojs6/org.autojs.autojs.inrt.SplashActivity');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 20;
        break;
      }

      out = true;
    } while (false);

    if (out === false) {
      log.debug('failed at nstep:', nstep);
    }

    return out;
  }

  public checkPackageInstalled(
    url: string,
    packageName: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const xadb = nestBrowser.getXAdbPath();
      exec(xadb + ' -s ' + url + ' shell pm list packages', (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        // log.debug("checkPackageInstalled = " + stdout)
        log.debug('checkPackageInstalled ======');
        log.debug('checkPackageInstalled packageName= ' + packageName);

        resolve(stdout.includes(packageName));
      });
    });
  }

  //卸载apk
  public async unInstallAndCheck(
    url: string,
    packageName: string,
  ): Promise<boolean> {
    let installExecError = false;
    return new Promise((resolve) => {
      // 安装 APK
      const xadb = nestBrowser.getXAdbPath();
      exec(xadb + ' -s ' + url + ' uninstall ' + packageName, async (error) => {
        if (error) {
          console.error('卸载失败:', error);
          installExecError = true;
          resolve(false);
        } else {
          while (true) {
            const isInstalled = await this.checkPackageInstalled(
              url,
              packageName,
            );
            log.debug('APK 检查当前安装状态 = ' + isInstalled);
            if (!isInstalled) {
              log.debug('APK 卸载成功');
              resolve(true);
              break;
            }

            log.debug('APK 卸载没有成功，5秒之后重新检查');
            await new Promise((resolve) => setTimeout(resolve, 5000)); // 等待 5 秒后重试

            // 如果安装执行时出错，直接结束循环
            if (installExecError) {
              console.error('卸载执行时出错');
              resolve(false);
              break;
            }
          }
        }
      });
    });
  }

  public async installAndCheck(
    url: string,
    apkPath: string,
    packageName: string,
  ): Promise<boolean> {
    let installExecError = false;
    return new Promise<boolean>((resolve) => {
      // 安装 APK
      const xadb = nestBrowser.getXAdbPath();
      exec(xadb + ' -s ' + url + ' install ' + apkPath, async (error) => {
        if (error) {
          console.error('安装失败:', error);
          installExecError = true;
          resolve(false);
        } else {
          while (true) {
            // 直接的安装结果
            const isInstalled = await this.checkPackageInstalled(
              url,
              packageName,
            );
            log.debug('APK 安装isInstalled结果 = ' + isInstalled);
            if (isInstalled) {
              log.debug('APK 安装成功');
              resolve(true);
              break;
            } else {
              log.debug('APK 安装没有安装成功，5秒之后重新检查');
              await new Promise((resolve) => setTimeout(resolve, 5000)); // 等待 5 秒后重试

              // 安装失败
              if (installExecError) {
                resolve(false);
                break;
              }
            }
          }
        }
      });
    });
  }

  public executeCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      let stdoutData = '';
      let stderrData = '';

      const childProcess = spawn(command, args, {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });

      // 监听标准输出（stdout）
      childProcess.stdout.setEncoding('utf8');
      childProcess.stdout.on('data', (data) => {
        stdoutData += data;
      });

      // 监听错误输出（stderr）
      childProcess.stderr.setEncoding('utf8');
      childProcess.stderr.on('data', (data) => {
        stderrData += data;
      });

      // 子进程结束后，解析并返回结果
      childProcess.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `cannot connect host and Child process execution failed:${stderrData}`,
            ),
          );
        } else {
          resolve(stdoutData.trim());
        }
      });

      // 可选：监听错误事件
      childProcess.on('error', (err) => {
        reject(err);
      });
    });
  }

  public async spawnEx(
    sCmd: string,
    sArg: string[],
    hide = true,
  ): Promise<ChildProcess> {
    return new Promise<ChildProcess>((resolve, reject) => {
      const pid = spawn(sCmd, sArg, {
        //stdio: 'inherit',
        detached: false,
        stdio: ['ignore', 'ignore', 'ignore'],
        windowsHide: hide,
      });

      pid.on('error', (code) => {
        log.error('[nest-process]vmessProvider exit:', code);
        reject(null);
      });

      pid.on('spawn', () => {
        log.debug('[nest-process]vmessProvider spawn:', pid.pid);
        resolve(pid);
      });
    });
  }

  public toBase64(data: MGC_ARGS): string {
    const buffer = Buffer.alloc(10 + data.len);

    buffer.writeInt32LE(data.time, 0);
    buffer.writeInt16LE(data.group, 4);
    buffer.writeInt16LE(data.port, 6);
    buffer.writeInt16LE(data.len, 8);
    buffer.write(data.serial, 10, 'utf8');

    const res = buffer.toString('base64');
    return res.replace(/\=/g, '#');
  }

  public getMGCArgs(url: string, group: number, svr_port: number): string {
    const structuredData: MGC_ARGS = {
      time: new Date().getTime() / 1000,
      group: group,
      port: svr_port,
      len: url.length,
      serial: url,
    };

    return this.toBase64(structuredData);
  }

  public async unionCpy(
    url: string,
    group: number,
    svr_port: number,
    args: any = null,
  ): Promise<number> {
    let new_args = null;
    const mgc_args = [];
    const mgc_arg = this.getMGCArgs(url, group, svr_port);
    mgc_args.push('-g');
    mgc_args.push(mgc_arg);
    if (args) {
      new_args = mgc_args.concat(args);
    } else {
      new_args = mgc_args;
    }
    let res = await this.connectAdb(url);
    if (!res) {
      //adb connection failed
      return 0;
    }
    res = await this.startCpy(url, new_args);
    return res ? 1 : -1;
  }

  public async startCpy(url: string, args: any = null): Promise<boolean> {
    const xcpy = nestBrowser.getXCpyPath();
    const sCmd = xcpy;
    const sArg: string[] = [];
    //sArg.push(`-s ${url}`);
    //sArg.push('-s');
    //sArg.push(url);
    if (args && args.length > 0) {
      for (const arg of args) {
        sArg.push(arg);
      }
    }
    log.debug('startCpy:', sCmd, sArg);
    const pid = await this.spawnEx(sCmd, sArg, false);
    if (pid) {
      return true;
    } else {
      return false;
    }
  }

  public async connectAdb(url: string): Promise<boolean> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('connect');
    sArg.push(url);
    //log.debug('connectAdb:', sCmd, sArg);
    //const pid = await this.spawnEx(sCmd, sArg);
    const data = await this.executeCommand(sCmd, sArg);
    log.debug('connectAdb:', data);
    if (data.toString().includes('cannot connect')) {
      return false;
    }
    return true;
    // if (pid) {
    //   return true;
    // } else {
    //   return false;
    // }
  }

  public async pressHome(url: string): Promise<boolean> {
    return this.pressKeyEvent(url, '3');
  }

  public async pressVolup(url: string): Promise<boolean> {
    return this.pressKeyEvent(url, 'VOLUME_UP');
  }

  public async pressVoldown(url: string): Promise<boolean> {
    return this.pressKeyEvent(url, 'VOLUME_DOWN');
  }

  public async pressKeyEvent(url: string, cmd: string): Promise<boolean> {
    //adb shell input keyevent 3
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('shell');
    sArg.push('input');
    sArg.push('keyevent');
    sArg.push(cmd);
    const pid = await this.spawnEx(sCmd, sArg);
    if (pid) {
      return true;
    } else {
      return false;
    }
  }

  public async executeShell(url: string, args: string[]): Promise<string> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('shell');
    if (args && args.length > 0) {
      for (const arg of args) {
        sArg.push(arg);
      }
    }
    const data = await this.executeCommand(sCmd, sArg).catch((err) => {
      log.error('executeShell error:', err);
      return 'error';
    });
    return data;
  }

  public async pushFile(url: string, args: string[]): Promise<string> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('push');
    if (args && args.length > 0) {
      for (const arg of args) {
        sArg.push(arg);
      }
    }
    const data = await this.executeCommand(sCmd, sArg).catch((err) => {
      log.error('pushFile error:', err);
      return '';
    });
    return data;
  }

  // public async  installAPK(
  //   url: string,
  //   apk: string,
  //   force = true,
  // ): Promise<boolean> {
  //   const xadb = nestBrowser.getXAdbPath();
  //   const sCmd = xadb;
  //   const sArg: string[] = [];
  //   sArg.push('-s');
  //   sArg.push(url);
  //   sArg.push('install');
  //   if (force) {
  //     sArg.push('-r');
  //   }
  //   sArg.push(apk);
  //   const pid = await this.spawnEx(sCmd, sArg);
  //   if (pid) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  // public async uninstallAPK(url: string, pkg: string): Promise<boolean> {
  //   const xadb = nestBrowser.getXAdbPath();
  //   const sCmd = xadb;
  //   const sArg: string[] = [];
  //   sArg.push('-s');
  //   sArg.push(url);
  //   sArg.push('uninstall');
  //   sArg.push(pkg);
  //   const pid = await this.spawnEx(sCmd, sArg);
  //   if (pid) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  public async startApp(
    url: string,
    pkg: string,
    act: string,
  ): Promise<boolean> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('shell');
    sArg.push('am');
    sArg.push('start');
    sArg.push('-n');
    sArg.push(pkg + '/' + act);
    const pid = await this.spawnEx(sCmd, sArg);
    if (pid) {
      return true;
    } else {
      return false;
    }
  }

  public async stopApp(url: string, pkg: string): Promise<boolean> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('shell');
    sArg.push('am');
    sArg.push('force-stop');
    sArg.push(pkg);
    const pid = await this.spawnEx(sCmd, sArg);
    if (pid) {
      return true;
    } else {
      return false;
    }
  }

  public async clearApp(url: string, pkg: string): Promise<boolean> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('shell');
    sArg.push('pm');
    sArg.push('clear');
    sArg.push(pkg);
    const pid = await this.spawnEx(sCmd, sArg);
    if (pid) {
      return true;
    } else {
      return false;
    }
  }

  public async getDevices() {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('devices');
    const data = await this.executeCommand(sCmd, sArg).catch((err) => {
      log.error('getDevices error:', err);
      return '';
    });
    return data;
  }

  public async getDeviceIP(url: string): Promise<string> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('shell');
    sArg.push('ip');
    sArg.push('addr');
    const data = await this.executeCommand(sCmd, sArg).catch((err) => {
      log.error('getDeviceIP error:', err);
      return '';
    });
    return data;
  }

  public async getDeviceModel(url: string): Promise<string> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('shell');
    sArg.push('getprop');
    sArg.push('ro.product.model');
    const data = await this.executeCommand(sCmd, sArg).catch((err) => {
      log.error('getDeviceModel error:', err);
      return '';
    });
    return data;
  }

  public async getDeviceBrand(url: string): Promise<string> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('shell');
    sArg.push('getprop');
    sArg.push('ro.product.brand');
    const data = await this.executeCommand(sCmd, sArg).catch((err) => {
      log.error('getDeviceModel error:', err);
      return '';
    });
    return data;
  }

  public async getDeviceOS(url: string): Promise<string> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('shell');
    sArg.push('getprop');
    sArg.push('ro.build.version.release');
    const data = await this.executeCommand(sCmd, sArg).catch((err) => {
      log.error('getDeviceModel error:', err);
      return '';
    });
    return data;
  }

  public async getDeviceSerial(url: string): Promise<string> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('get-serialno');
    const data = await this.executeCommand(sCmd, sArg).catch((err) => {
      log.error('getDeviceModel error:', err);
      return '';
    });
    return data;
  }

  public async getDeviceState(url: string): Promise<string> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('get-state');
    const data = await this.executeCommand(sCmd, sArg).catch((err) => {
      log.error('getDeviceModel error:', err);
      return '';
    });
    return data;
  }

  public async getDeviceIMEI(url: string): Promise<string> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('shell');
    sArg.push('service');
    sArg.push('call');
    sArg.push('iphonesubinfo');
    sArg.push('1');
    sArg.push('i32');
    sArg.push('1');
    const data = await this.executeCommand(sCmd, sArg).catch((err) => {
      log.error('getDeviceModel error:', err);
      return '';
    });
    return data;
  }

  public async getDeviceMac(url: string): Promise<string> {
    const xadb = nestBrowser.getXAdbPath();
    const sCmd = xadb;
    const sArg: string[] = [];
    sArg.push('-s');
    sArg.push(url);
    sArg.push('shell');
    sArg.push('cat');
    sArg.push('/sys/class/net/wlan0/address');
    const data = await this.executeCommand(sCmd, sArg).catch((err) => {
      log.error('getDeviceModel error:', err);
      return '';
    });
    return data;
  }
}
