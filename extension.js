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

    // Start/Stop AFS Client
    this._startItem = new PopupMenu.PopupMenuItem(_('Start AFS Client'));
    this._stopItem = new PopupMenu.PopupMenuItem(_('Stop AFS Client'));
    this.menu.addMenuItem(this._startItem);
    this.menu.addMenuItem(this._stopItem);

    // Token Status
    this._tokenStatusItem = new PopupMenu.PopupMenuItem(_('Token: Not Available'));
    this.menu.addMenuItem(this._tokenStatusItem);

    // Client Status
    this._clientStatusItem = new PopupMenu.PopupMenuItem(_('Client: Checking...'));
    this.menu.addMenuItem(this._clientStatusItem);

    // Connect signals
    this._startItem.connect('activate', () => {
      log('Start AFS Client');
      // UI simulation only
      this._startItem.setSensitive(false);
      this._stopItem.setSensitive(true);
      this._clientStatusItem.label.set_text(_('Client: Running'));
    });

    this._stopItem.connect('activate', () => {
      log('Stop AFS Client');
      this._startItem.setSensitive(true);
      this._stopItem.setSensitive(false);
      this._clientStatusItem.label.set_text(_('Client: Not Running'));
    });

    // Dynamic update on menu open
    this.menu.connect('open-state-changed', (menu, isOpen) => {
      if (isOpen) {
        this._updateClientStatus();
      }
    });

    // Initial status check
    this._updateClientStatus();
  }

  _updateClientStatus() {
    try {
      let [ok, out] = GLib.spawn_command_line_sync('systemctl is-active openafs-client');
      if (ok) {
        let result = out.toString().trim();
        if (result === 'active') {
          this._clientStatusItem.label.set_text(_('Client: Running'));
          this._startItem.setSensitive(false);
          this._stopItem.setSensitive(true);
        } else {
          this._clientStatusItem.label.set_text(_('Client: Not Running'));
          this._startItem.setSensitive(true);
          this._stopItem.setSensitive(false);
        }
      } else {
        this._clientStatusItem.label.set_text(_('Client: Unknown'));
      }
    } catch (e) {
      logError(e);
      this._clientStatusItem.label.set_text(_('Client: Error'));
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