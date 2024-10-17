import { ChildProcess, spawn } from 'child_process';
import { app } from 'electron';
import { log } from '../utils/log';
import { nestBrowser } from './nest-browser';
import { existsSync, writeFileSync } from 'fs';
import { normalize, join } from 'path';



import { exec } from 'child_process';




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
  
  //net_phone_script_name :需要执行的script name
  public async syncCookies(host: any, port: any, id: any, scriptFile: any, net_phone_script_name: any) {


    let out = false;
    let nstep = 0;
    do {
      const url = `${host}:${port}`;
      let bres = await this.connectAdb(url);
      if (!bres) {
        nstep = 1;
        break;
      }
     
      args = [];
      args.push(scriptFile);
      args.push('/sdcard/Download');
      res = await this.pushFile(url, args);
      if (res === '') {
        nstep = 2;
        break;
      }
	  
	  
	  
      args = [];
      args.push('am');
      args.push('force-stop');
      args.push('org.autojs.autoxjs');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 3;
        break;
      }


      
	  let args = [];
      args = [];
      args.push('settings');
      args.push('put');
      args.push('secure');
      args.push('enabled_accessibility_services');
      args.push(
        'org.autojs.autoxjs/com.stardust.autojs.core.accessibility.AccessibilityService',
      );
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 4;
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
        nstep = 5;
        break;
      }
	  
	  //文件权限：adb shell appops set --uid org.autojs.autoxjs MANAGE_EXTERNAL_STORAGE allow
	  args = [];
      args.push('appops');
      args.push('set');
	  args.push('--uid');
      args.push('org.autojs.autoxjs');
      args.push('MANAGE_EXTERNAL_STORAGE');
	  args.push('allow');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 6;
        break;
      }
	  
	  
	  //adb shell pm grant org.autojs.autoxjs android.permission.READ_EXTERNAL_STORAGE
      args = [];
      args.push('pm');
      args.push('grant');
      args.push('org.autojs.autoxjs');
      args.push('android.permission.READ_EXTERNAL_STORAGE');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 7;
        break;
      }

	  //adb shell pm grant org.autojs.autoxjs android.permission.SYSTEM_ALERT_WINDOW
      args = [];
      args.push('pm');
      args.push('grant');
      args.push('org.autojs.autoxjs');
      args.push('android.permission.SYSTEM_ALERT_WINDOW');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 8;
        break;
      }

	  //截图权限：adb shell appops set org.autojs.autoxjs PROJECT_MEDIA allow
      args = [];
      args.push('appops');
      args.push('set');
      args.push('org.autojs.autoxjs');
      args.push('PROJECT_MEDIA');
	  args.push('allow');
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 9;
        break;
      }


   
	  //adb shell am start -W -n org.autojs.autoxjs/org.autojs.autojs.ui.main.MainActivity --es "net_script_name" "FB_gerenfawen"
      args = [];
      args.push('am');
      args.push('start');
      args.push('-W');
      args.push('-n');
      args.push('org.autojs.autoxjs/org.autojs.autojs.ui.main.MainActivity');
	  args.push('--es');
	  args.push('net_script_name');
	  args.push(net_phone_script_name);
      res = await this.executeShell(url, args);
      if (res === 'error') {
        nstep = 10;
        break;
      }

      out = true;
    } while (false);

    if (out === false) {
      log.debug('failed at nstep:', nstep);
    }

    return out;
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
