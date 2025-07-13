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
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

export function updateClientStatus(clientStatusLabel, startItem, stopItem) {
  const subprocess = Gio.Subprocess.new([
    'systemctl', 'is-active', 'openafs-client'
  ], Gio.SubprocessFlags.STDOUT_PIPE);

  subprocess.communicate_utf8_async(null, null, (proc, res) => {
    try {
      let [, stdout] = proc.communicate_utf8_finish(res);
      let result = stdout.trim();
      if (result === 'active') {
        clientStatusLabel.text = _('Client: Running');
        startItem.setSensitive(false);
        stopItem.setSensitive(true);
      } else {
        clientStatusLabel.text = _('Client: Not Running');
        startItem.setSensitive(true);
        stopItem.setSensitive(false);
      }
    } catch (e) {
      logError(e);
      clientStatusLabel.text = _('Client: Error');
    }
  });
}

export function updateTokenStatus(tokenStatusLabel) {
  const subprocess = Gio.Subprocess.new(['tokens'], Gio.SubprocessFlags.STDOUT_PIPE);
  subprocess.communicate_utf8_async(null, null, (proc, res) => {
    try {
      let [, stdout] = proc.communicate_utf8_finish(res);
      let output = stdout.toString();
      let match = output.match(/AFS ID (\d+).*?for ([\w.-]+).*?\[Expires (.+?)\]/);
      if (match) {
        let afsId = match[1];
        let cell = match[2];
        let expiry = match[3];
        tokenStatusLabel.text = `Token: ID ${afsId}, ${cell}, Expires: ${expiry}`;
      } else {
        tokenStatusLabel.text = _('Token: Not Available');
      }
    } catch (e) {
      logError(e);
      tokenStatusLabel.text = _('Token: Error');
    }
  });
}