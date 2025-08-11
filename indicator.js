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
import GLib from 'gi://GLib';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import { updateClientStatus, updateTokenStatus } from './utils.js';

export const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init(extension) {
      super._init(0.0, _('OpenAFS Status'));

      // Store extension for accessing path
      this._extension = extension;

      // Create icon as a class property with custom SVG
      this._icon = new St.Icon({
        gicon: Gio.icon_new_for_string(`${this._extension.path}/icons/client-on-symbolic.svg`),
        style_class: 'system-status-icon',
      });
      this.add_child(this._icon);

      // Menu items
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

      // Connect start action
      this._startItem.connect('activate', () => {
        this._clientStatusLabel.text = _('Client: Starting...');
        this._startItem.setSensitive(false);
        this._stopItem.setSensitive(false);  // Immediate feedback and disable both
        try {
          const subprocess = Gio.Subprocess.new(
            ['systemctl', 'start', 'openafs-client'],
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
          );
          subprocess.communicate_utf8_async(null, null, (proc, res) => {
            try {
              let [, stdout, stderr] = proc.communicate_utf8_finish(res);
              if (proc.get_successful()) {
                this._clientStatusLabel.text = _('Client: Running');
                this._stopItem.setSensitive(true);
                this.setIconName('client-on-symbolic.svg');  // Optimistic icon update
              } else {
                logError(`[openafs] Failed to start client: ${stderr}`);
                this._clientStatusLabel.text = _('Client: Failed to Start');
                this._startItem.setSensitive(true);
                this.updateStatuses();  // Correct state if needed
              }
            } catch (e) {
              logError(`[openafs] Failed to start client: ${e.message}`);
              this._clientStatusLabel.text = _('Client: Failed to Start');
              this._startItem.setSensitive(true);
              this.updateStatuses();
            }
          });
        } catch (e) {
          logError(`[openafs] Failed to run systemctl start: ${e.message}`);
          this._clientStatusLabel.text = _('Client: Error');
          this._startItem.setSensitive(true);
          this.updateStatuses();
        }
      });

      // Connect stop action
      this._stopItem.connect('activate', () => {
        this._clientStatusLabel.text = _('Client: Stopping...');
        this._startItem.setSensitive(false);
        this._stopItem.setSensitive(false);  // Immediate feedback and disable both
        try {
          const subprocess = Gio.Subprocess.new(
            ['systemctl', 'stop', 'openafs-client'],
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
          );
          subprocess.communicate_utf8_async(null, null, (proc, res) => {
            try {
              let [, stdout, stderr] = proc.communicate_utf8_finish(res);
              if (proc.get_successful()) {
                this._clientStatusLabel.text = _('Client: Not Running');
                this._startItem.setSensitive(true);
                this.setIconName('client-off-symbolic.svg');  // Optimistic icon update
              } else {
                logError(`[openafs] Failed to stop client: ${stderr}`);
                this._clientStatusLabel.text = _('Client: Failed to Stop');
                this._stopItem.setSensitive(true);
                this.updateStatuses();  // Correct state if needed
              }
            } catch (e) {
              logError(`[openafs] Failed to stop client: ${e.message}`);
              this._clientStatusLabel.text = _('Client: Failed to Stop');
              this._stopItem.setSensitive(true);
              this.updateStatuses();
            }
          });
        } catch (e) {
          logError(`[openafs] Failed to run systemctl stop: ${e.message}`);
          this._clientStatusLabel.text = _('Client: Error');
          this._stopItem.setSensitive(true);
          this.updateStatuses();
        }
      });

      // Update status and icon when menu is opened
      this.menu.connect('open-state-changed', (menu, isOpen) => {
        if (isOpen) {
          this.updateStatuses();
          this._updateTimeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
            this.updateStatuses();
            return GLib.SOURCE_CONTINUE;  // Keep timeout running
          });
        } else if (this._updateTimeout) {
          GLib.source_remove(this._updateTimeout);
          this._updateTimeout = null;
        }
      });

      // Initial status and icon update
      this.updateStatuses();
    }

    // Method to update the icon
    setIconName(name) {
      this._icon.gicon = Gio.icon_new_for_string(`${this._extension.path}/icons/${name}`);
    }

    // Method for combined updates
    updateStatuses() {
      updateClientStatus(this._clientStatusLabel, this._startItem, this._stopItem, (state) => {
        // Set icon based on state
        if (state === 'active' || state === 'deactivating') {
          this.setIconName('client-on-symbolic.svg');  // Client is running or still stopping
        } else {
          this.setIconName('client-off-symbolic.svg');  // Client is inactive, failed, activating, or error
        }
      });
      updateTokenStatus(this._tokenStatusLabel);
    }
  });