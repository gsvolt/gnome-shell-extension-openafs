/* utils.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

export function updateClientStatus(clientStatusLabel, startItem, stopItem, callback) {
  try {
    const subprocess = Gio.Subprocess.new(
      ['/usr/bin/systemctl', 'is-active', 'openafs-client'],
      Gio.SubprocessFlags.STDOUT_PIPE
    );

    subprocess.communicate_utf8_async(null, null, (proc, res) => {
      try {
        let [, stdout] = proc.communicate_utf8_finish(res);
        let state = stdout.trim();

        switch (state) {
          case 'active':
            // If running, also check cell name
            try {
              const cellProc = Gio.Subprocess.new(
                ['/usr/bin/fs', 'wscell'],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
              );
              cellProc.communicate_utf8_async(null, null, (cellP, cellRes) => {
                try {
                  let [ok, cellOut, cellErr] = cellP.communicate_utf8_finish(cellRes);
                  let cell = cellOut.trim();
                  if (!cell || cell.includes('not recognized')) {
                    clientStatusLabel.text = _('Client: Running (cell: not available)');
                  } else {
                    clientStatusLabel.text = _('Client: ') + cell;
                  }
                } catch (e) {
                  logError(`[openafs] Failed to get cell: ${e.message}`);
                  clientStatusLabel.text = _('Client: Running (cell: error)');
                }
              });
            } catch (e) {
              logError(`[openafs] Failed to run /usr/bin/fs wscell: ${e.message}`);
              clientStatusLabel.text = _('Client: Running (cell: error)');
            }
            startItem.setSensitive(false);
            stopItem.setSensitive(true);
            if (callback) callback(state);
            break;

          case 'activating':
            clientStatusLabel.text = _('Client: Starting...');
            startItem.setSensitive(false);
            stopItem.setSensitive(false);  // Disable both during transition
            if (callback) callback(state);
            break;

          case 'deactivating':
            clientStatusLabel.text = _('Client: Stopping...');
            startItem.setSensitive(false);
            stopItem.setSensitive(false);  // Disable both during transition
            if (callback) callback(state);
            break;

          case 'failed':
            clientStatusLabel.text = _('Client: Error');
            startItem.setSensitive(true);
            stopItem.setSensitive(false);
            if (callback) callback(state);
            break;

          default: // 'inactive' or unknown
            clientStatusLabel.text = _('Client: Not Running');
            startItem.setSensitive(true);
            stopItem.setSensitive(false);
            if (callback) callback(state);
            break;
        }
      } catch (e) {
        logError(`[openafs] ${e.message}`);
        clientStatusLabel.text = _('Client: Error');
        if (callback) callback('error');
      }
    });
  } catch (e) {
    logError(`[openafs] Failed to run "/usr/bin/systemctl is-active openafs-client": ${e.message}`);
    clientStatusLabel.text = _('Client: Error');
    if (callback) callback('error');
  }
}

export function updateTokenStatus(tokenStatusLabel) {
  try {
    const subprocess = Gio.Subprocess.new(['/usr/bin/tokens'], Gio.SubprocessFlags.STDOUT_PIPE);
    subprocess.communicate_utf8_async(null, null, (proc, res) => {
      try {
        let [, stdout] = proc.communicate_utf8_finish(res);
        let output = stdout.toString();

        const tokenRegex = /AFS ID (\d+).*?for ([\w.-]+).*?\[Expires (.+?)\]/g;
        let match;
        let tokens = [];

        while ((match = tokenRegex.exec(output)) !== null) {
          let afsId = match[1];
          let cell = match[2];
          let expiry = match[3];
          tokens.push(`ID ${afsId}, ${cell}, Expires: ${expiry}`);
        }

        if (tokens.length > 0) {
          tokenStatusLabel.text = 'Token(s):\n' + tokens.join('\n');
        } else {
          tokenStatusLabel.text = _('Token: Not Available');
        }
      } catch (e) {
        logError(`[openafs] ${e.message}`);
        tokenStatusLabel.text = _('Token: Error');
      }
    });
  } catch (e) {
    logError(`[openafs] Failed to run /usr/bin/tokens: ${e.message}`);
    tokenStatusLabel.text = _('Token: Error');
  }
}

export function updateAutostartStatus(autostartItem, callback) {
  try {
    const subprocess = Gio.Subprocess.new(
      ['/usr/bin/systemctl', 'is-enabled', 'openafs-client'],
      Gio.SubprocessFlags.STDOUT_PIPE
    );

    subprocess.communicate_utf8_async(null, null, (proc, res) => {
      try {
        let [, stdout] = proc.communicate_utf8_finish(res);
        let state = stdout.trim();
        if (state === 'enabled') {
          autostartItem.setToggleState(true);
          autostartItem.label.text = _('Autostart on Boot');
          autostartItem.setSensitive(true);
          if (callback) callback(state);
        } else {
          autostartItem.setToggleState(false);
          autostartItem.label.text = _('Autostart on Boot');
          autostartItem.setSensitive(true);
          if (callback) callback(state);
        }
      } catch (e) {
        logError(`[openafs] Failed to check autostart: ${e.message}`);
        autostartItem.label.text = _('Autostart: Error');
        autostartItem.setSensitive(false);
        if (callback) callback('error');
      }
    });
  } catch (e) {
    logError(`[openafs] Failed to run "/usr/bin/systemctl is-enabled openafs-client": ${e.message}`);
    autostartItem.label.text = _('Autostart: Error');
    autostartItem.setSensitive(false);
    if (callback) callback('error');
  }
}

export function toggleAutostart(autostartItem, callback) {
  updateAutostartStatus(autostartItem, (currentState) => {
    if (currentState === 'error') {
      Main.notify(_('OpenAFS Client'), _('Failed to check autostart status'));
      return;
    }
    const action = currentState === 'enabled' ? 'disable' : 'enable';
    autostartItem.label.text =
      action === 'enable' ? _('Enabling Autostart...') : _('Disabling Autostart...');
    autostartItem.setSensitive(false);

    try {
      const subprocess = Gio.Subprocess.new(
        ['/usr/bin/pkexec', '/usr/bin/systemctl', action, 'openafs-client'],
        Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
      );
      subprocess.communicate_utf8_async(null, null, (proc, res) => {
        try {
          let [, , stderr] = proc.communicate_utf8_finish(res);
          if (proc.get_successful()) {
            updateAutostartStatus(autostartItem, callback);
            Main.notify(
              _('OpenAFS Client'),
              action === 'enable'
                ? _('Autostart enabled successfully')
                : _('Autostart disabled successfully')
            );
          } else {
            logError(`[openafs] Failed to ${action} autostart: ${stderr}`);
            autostartItem.label.text = _('Autostart: Error');
            autostartItem.setSensitive(true);
            Main.notify(_('OpenAFS Client'), _('Failed to toggle autostart'));
          }
        } catch (e) {
          logError(`[openafs] Failed to ${action} autostart: ${e.message}`);
          autostartItem.label.text = _('Autostart: Error');
          autostartItem.setSensitive(true);
          Main.notify(_('OpenAFS Client'), _('Error toggling autostart'));
        }
      });
    } catch (e) {
      logError(`[openafs] Failed to run systemctl ${action}: ${e.message}`);
      autostartItem.label.text = _('Autostart: Error');
      autostartItem.setSensitive(true);
      Main.notify(_('OpenAFS Client'), _('Error toggling autostart'));
    }
  });
}
