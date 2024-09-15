import { Option } from 'widget/settings/shared/Option';
import { Header } from 'widget/settings/shared/Header';

import options from 'options';
import Scrollable from 'types/widgets/scrollable';
import { Attribute, GtkWidget } from 'lib/types/widget';

export const OverivewMenuSettings = (): Scrollable<GtkWidget, Attribute> => {
    return Widget.Scrollable({
        vscroll: 'automatic',
        child: Widget.Box({
            class_name: 'bar-theme-page paged-container',
            vertical: true,
            children: [
                Header('Overview'),
                Option({
                    opt: options.menus.overview.monochromeIcon,
                    title: 'Use mono icon',
                    type: 'boolean',
                }),
                Option({
                    opt: options.menus.overview.scale,
                    title: 'Scale',
                    type: 'number',
                }),
                Option({
                    opt: options.menus.overview.workspaces,
                    title: 'Workspcase number',
                    type: 'number',
                }),
            ],
        }),
    });
};
