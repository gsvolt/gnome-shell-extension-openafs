/* indicator.js
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
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import { updateClientStatus, updateTokenStatus } from './utils.js';

export const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
  _init() {
    super._init(0.0, _('OpenAFS Status'));

    const icon = new St.Icon({
      icon_name: 'network-wired-symbolic',
      style_class: 'system-status-icon',
    });
    this.add_child(icon);

    this._startItem = new PopupMenu.PopupMenuItem(_('Start OpenAFS Client'));
    this._stopItem = new PopupMenu.PopupMenuItem(_('Stop OpenAFS Client'));
    this.menu.addMenuItem(this._startItem);
    this.menu.addMenuItem(this._stopItem);

    this._tokenStatusItem = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false, hover: false });
    this._tokenStatusLabel = new St.Label({ text: _('Token: Checking...'), x_align: Clutter.ActorAlign.START });
    this._tokenStatusItem.add_child(this._tokenStatusLabel);
    this.menu.addMenuItem(this._tokenStatusItem);

    this._clientStatusItem = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false, hover: false });
    this._clientStatusLabel = new St.Label({ text: _('Client: Checking...'), x_align: Clutter.ActorAlign.START });
    this._clientStatusItem.add_child(this._clientStatusLabel);
    this.menu.addMenuItem(this._clientStatusItem);

    this._startItem.connect('activate', () => {
      try {
        Gio.Subprocess.new(['systemctl', 'start', 'openafs-client'], Gio.SubprocessFlags.NONE);
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
        Gio.Subprocess.new(['systemctl', 'stop', 'openafs-client'], Gio.SubprocessFlags.NONE);
        this._clientStatusLabel.text = _('Client: Stopping...');
        this._startItem.setSensitive(true);
        this._stopItem.setSensitive(false);
      } catch (e) {
        logError(e);
        this._clientStatusLabel.text = _('Client: Failed to Stop');
      }
    });

    this.menu.connect('open-state-changed', (menu, isOpen) => {
      if (isOpen) {
        updateClientStatus(this._clientStatusLabel, this._startItem, this._stopItem);
        updateTokenStatus(this._tokenStatusLabel);
      }
    });

    updateClientStatus(this._clientStatusLabel, this._startItem, this._stopItem);
    updateTokenStatus(this._tokenStatusLabel);
  }
});