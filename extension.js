/* extension.js
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

import GObject from 'gi://GObject';
import St from 'gi://St';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
  _init() {
    super._init(0.0, _('OpenAFS Status'));

    const icon = new St.Icon({
      icon_name: 'network-wired-symbolic',
      style_class: 'system-status-icon',
    });
    this.add_child(icon);

    // --- Action Buttons ---
    this._startItem = new PopupMenu.PopupMenuItem(_('Start AFS Client'));
    this._stopItem = new PopupMenu.PopupMenuItem(_('Stop AFS Client'));
    this.menu.addMenuItem(this._startItem);
    this.menu.addMenuItem(this._stopItem);

    // --- Token Status (non-clickable) ---
    this._tokenStatusItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
      hover: false,
    });
    this._tokenStatusLabel = new St.Label({
      text: _('Token: Checking...'),
      x_align: Clutter.ActorAlign.START,
    });
    this._tokenStatusItem.add_child(this._tokenStatusLabel);
    this.menu.addMenuItem(this._tokenStatusItem);

    // --- Client Status (non-clickable) ---
    this._clientStatusItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
      hover: false,
    });
    this._clientStatusLabel = new St.Label({
      text: _('Client: Checking...'),
      x_align: Clutter.ActorAlign.START,
    });
    this._clientStatusItem.add_child(this._clientStatusLabel);
    this.menu.addMenuItem(this._clientStatusItem);

    // --- Connect buttons ---
    this._startItem.connect('activate', () => {
      try {
        GLib.spawn_command_line_async('systemctl start openafs-client');
        this._clientStatusLabel.text = _('Client: Starting...');
        this._startItem.setSensitive(false);
        this._stopItem.setSensitive(true);
      } catch (e) {
        logError(e);
        this._clientStatusLabel.text = _('Client: Failed to Start');
      }
    });

    this._stopItem.connect('activate', () => {
      try {
        GLib.spawn_command_line_async('systemctl stop openafs-client');
        this._clientStatusLabel.text = _('Client: Stopping...');
        this._startItem.setSensitive(true);
        this._stopItem.setSensitive(false);
      } catch (e) {
        logError(e);
        this._clientStatusLabel.text = _('Client: Failed to Stop');
      }
    });

    // --- Update status when menu opens ---
    this.menu.connect('open-state-changed', (menu, isOpen) => {
      if (isOpen) {
        this._updateClientStatus();
        this._updateTokenStatus();
      }
    });

    // --- Initial Status ---
    this._updateClientStatus();
    this._updateTokenStatus();
  }

  _updateClientStatus() {
    try {
      let [ok, out] = GLib.spawn_command_line_sync('systemctl is-active openafs-client');
      if (ok) {
        let result = out.toString().trim();
        if (result === 'active') {
          this._clientStatusLabel.text = _('Client: Running');
          this._startItem.setSensitive(false);
          this._stopItem.setSensitive(true);
        } else {
          this._clientStatusLabel.text = _('Client: Not Running');
          this._startItem.setSensitive(true);
          this._stopItem.setSensitive(false);
        }
      } else {
        this._clientStatusLabel.text = _('Client: Unknown');
      }
    } catch (e) {
      logError(e);
      this._clientStatusLabel.text = _('Client: Error');
    }
  }

  _updateTokenStatus() {
    try {
      let [ok, out] = GLib.spawn_command_line_sync('tokens');
      if (ok) {
        let output = out.toString();
        let match = output.match(/AFS ID (\d+).*?for ([^\s]+).*?\[Expires (.*?)\]/);
        if (match) {
          let afsId = match[1];
          let cell = match[2];
          let expiry = match[3];
          this._tokenStatusLabel.text = `Token: ID ${afsId}, ${cell}, Expires: ${expiry}`;
        } else {
          this._tokenStatusLabel.text = _('Token: Not Available');
        }
      } else {
        this._tokenStatusLabel.text = _('Token: Unknown');
      }
    } catch (e) {
      logError(e);
      this._tokenStatusLabel.text = _('Token: Error');
    }
  }
});

export default class OpenAFSStatusExtension extends Extension {
  enable() {
    this._indicator = new Indicator();
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
  }
}
