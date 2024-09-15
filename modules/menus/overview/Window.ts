import { type Client } from 'types/service/hyprland';
import { createSurfaceFromWidget, icon } from 'lib/utils';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk?version=3.0';
import options from 'options';
import icons from 'lib/icons';
import Button from 'types/widgets/button';
import Icon from 'types/widgets/icon';

const monochrome = options.menus.overview.monochromeIcon;
const TARGET = [Gtk.TargetEntry.new('text/plain', Gtk.TargetFlags.SAME_APP, 0)];
const hyprland = await Service.import('hyprland');
const apps = await Service.import('applications');
const dispatch = (args: string): Promise<string> => hyprland.messageAsync(`dispatch ${args}`);

export default ({ address, size: [w, h], class: c, title }: Client): Button<Icon<unknown>, { address: string }> =>
    Widget.Button({
        class_name: 'client',
        attribute: { address },
        tooltip_text: `${title}`,
        child: Widget.Icon({
            css: options.menus.overview.scale.bind().as(
                (v) => `
            min-width: ${(v / 100) * w}px;
            min-height: ${(v / 100) * h}px;
        `,
            ),
            icon: monochrome.bind().as((m) => {
                const app = apps.list.find((app) => app.match(c));
                const icon_name = app ? app.icon_name + (m ? '-symbolic' : '') : c + (m ? '-symbolic' : '');
                return icon(icon_name, icons.fallback.executable + (m ? '-symbolic' : ''));
            }),
        }),
        on_secondary_click: () => dispatch(`closewindow address:${address}`),
        on_clicked: () => {
            dispatch(`focuswindow address:${address}`);
            App.closeWindow('overview');
        },
        setup: (btn) =>
            btn
                .on('drag-data-get', (_w, _c, data) => data.set_text(address, address.length))
                .on('drag-begin', (_, context) => {
                    Gtk.drag_set_icon_surface(context, createSurfaceFromWidget(btn));
                    btn.toggleClassName('hidden', true);
                })
                .on('drag-end', () => btn.toggleClassName('hidden', false))
                .drag_source_set(Gdk.ModifierType.BUTTON1_MASK, TARGET, Gdk.DragAction.COPY),
    });
