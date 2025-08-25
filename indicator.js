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
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import { updateClientStatus, updateTokenStatus, updateAutostartStatus, toggleAutostart } from './utils.js';

export const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init(extension) {
      super._init(0.0, _('OpenAFS Status'));

      // Store extension for accessing path
      this._extension = extension;

      // Create icon as a class property with custom SVG (non-symbolic)
      this._icon = new St.Icon({
        gicon: Gio.icon_new_for_string(`${this._extension.path}/icons/client-on.svg`),
        style_class: 'system-status-icon',
        icon_size: 28, // Explicitly set size for non-symbolic icons
      });
      this.add_child(this._icon);

      // Menu items
      this._startItem = new PopupMenu.PopupMenuItem(_('Start OpenAFS Client'));
      this._stopItem = new PopupMenu.PopupMenuItem(_('Stop OpenAFS Client'));
      this._autostartItem = new PopupMenu.PopupSwitchMenuItem(_('Autostart on Boot'), false);
      this.menu.addMenuItem(this._startItem);
      this.menu.addMenuItem(this._stopItem);
      this.menu.addMenuItem(this._autostartItem);

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
              let [, , stderr] = proc.communicate_utf8_finish(res);
              if (proc.get_successful()) {
                this._clientStatusLabel.text = _('Client: Running');
                this._stopItem.setSensitive(true);
                this.setIconName('client-on.svg');  // Updated to non-symbolic name
                Main.notify(_('OpenAFS Client'), _('OpenAFS client started successfully'));
              } else {
                console.error(`[openafs] Failed to start client: ${stderr}`);
                this._clientStatusLabel.text = _('Client failed to start');
                this._startItem.setSensitive(true);
                this.updateStatuses();
                Main.notify(_('OpenAFS Client'), _('Failed to start OpenAFS client'));
              }
            } catch (e) {
              console.error(`[openafs] Failed to start client: ${e.message}`);
              this._clientStatusLabel.text = _('Client: Failed to Start');
              this._startItem.setSensitive(true);
              this.updateStatuses();
              Main.notify(_('OpenAFS Client'), _('Error starting OpenAFS client'));
            }
          });
        } catch (e) {
          console.error(`[openafs] Failed to run systemctl start: ${e.message}`);
          this._clientStatusLabel.text = _('Client: Error');
          this._startItem.setSensitive(true);
          this.updateStatuses();
          Main.notify(_('OpenAFS Client'), _('Error starting OpenAFS client'));
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
              let [, , stderr] = proc.communicate_utf8_finish(res);
              if (proc.get_successful()) {
                this._clientStatusLabel.text = _('Client: Not Running');
                this._startItem.setSensitive(true);
                this.setIconName('client-off.svg');  // Updated to non-symbolic name
                Main.notify(_('OpenAFS Client'), _('OpenAFS client stopped successfully'));
              } else {
                console.error(`[openafs] Failed to stop client: ${stderr}`);
                this._clientStatusLabel.text = _('Client: Failed to Stop');
                this._stopItem.setSensitive(true);
                this.updateStatuses();
                Main.notify(_('OpenAFS Client'), _('Failed to stop OpenAFS client'));
              }
            } catch (e) {
              console.error(`[openafs] Failed to stop client: ${e.message}`);
              this._clientStatusLabel.text = _('Client: Failed to Stop');
              this._stopItem.setSensitive(true);
              this.updateStatuses();
              Main.notify(_('OpenAFS Client'), _('Error stopping OpenAFS client'));
            }
          });
        } catch (e) {
          console.error(`[openafs] Failed to run systemctl stop: ${e.message}`);
          this._clientStatusLabel.text = _('Client: Error');
          this._stopItem.setSensitive(true);
          this.updateStatuses();
          Main.notify(_('OpenAFS Client'), _('Error stopping OpenAFS client'));
        }
      });

      this._autostartItem.connect('toggled', () => {
        toggleAutostart(this._autostartItem, () => {
          // Update switch state and label after toggle completes
          updateAutostartStatus(this._autostartItem);
        });
      });

      // Update status and icon when menu is opened
      this.menu.connect('open-state-changed', (menu, isOpen) => {
        if (isOpen) {
          this.updateStatuses();
          this._updateTimeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
            this.updateStatuses();
            return GLib.SOURCE_CONTINUE;
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
          this.setIconName('client-on.svg');  // Updated to non-symbolic name
        } else {
          this.setIconName('client-off.svg');  // Updated to non-symbolic name
        }
      });
      updateTokenStatus(this._tokenStatusLabel);
      updateAutostartStatus(this._autostartItem);
    }
  });