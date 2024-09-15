import { Option } from 'widget/settings/shared/Option';
import { Header } from 'widget/settings/shared/Header';

import options from 'options';

export const OverviewMenuTheme = () => {
    return Widget.Scrollable({
        vscroll: 'automatic',
        hscroll: 'automatic',
        class_name: 'menu-theme-page notifications paged-container',
        vexpand: true,
        child: Widget.Box({
            vertical: true,
            children: [
                Header('Color'),
                Option({
                    opt: options.theme.bar.menus.menu.overview.background,
                    title: 'Background',
                    type: 'color',
                }),
                Option({
                    opt: options.theme.bar.menus.menu.overview.border,
                    title: 'Border',
                    type: 'color',
                }),
            ],
        }),
    });
};
