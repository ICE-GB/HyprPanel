import { launchApp, icon } from 'lib/utils';
import icons from 'lib/icons';
import options from 'options';
import Box from 'types/widgets/box';
import { BarBoxChild } from 'lib/types/bar';
import { Child } from 'lib/types/widget';

const hyprland = await Service.import('hyprland');
const apps = await Service.import('applications');
const { monochrome, exclusive, iconSize } = options.bar.taskbar;
const { layer: position } = options.theme.bar;

const focus = (address: string): Promise<string> => hyprland.messageAsync(`dispatch focuswindow address:${address}`);

const DummyItem = (address: string): Box<Child, { address: string }> =>
    Widget.Box({
        attribute: { address },
        visible: false,
    });

const AppItem = (address: string): Box<Child, { address: string }> => {
    const client = hyprland.getClient(address);
    if (!client || client.class === '') return DummyItem(address);

    const app = apps.list.find((app) => app.match(client.class));

    const btn = Widget.Button({
        class_name: 'bar-button-icon taskbar txt-icon bar',
        tooltip_text: Utils.watch(client.title, hyprland, () => hyprland.getClient(address)?.title || ''),
        on_primary_click: () => focus(address),
        on_middle_click: () => app && launchApp(app),
        child: Widget.Icon({
            size: iconSize.bind(),
            icon: monochrome
                .bind()
                .as((m: boolean) =>
                    icon(
                        (app?.icon_name || client.class) + (m ? '-symbolic' : ''),
                        icons.fallback.executable + (m ? '-symbolic' : ''),
                    ),
                ),
        }),
    });

    return Widget.Box(
        {
            attribute: { address },
            visible: Utils.watch(true, [exclusive, hyprland], () => {
                return exclusive.value ? hyprland.active.workspace.id === client.workspace.id : true;
            }),
        },
        Widget.Overlay({
            child: btn,
            pass_through: true,
            overlay: Widget.Box({
                className: 'indicator',
                hpack: 'center',
                vpack: position.bind().as((p: string) => (p === 'top' ? 'start' : 'end')),
                setup: (w) =>
                    w.hook(hyprland, () => {
                        w.toggleClassName('active', hyprland.active.client.address === address);
                    }),
            }),
        }),
    );
};

function sortItems<T extends { attribute: { address: string } }>(arr: T[]): T[] {
    return arr.sort(({ attribute: a }, { attribute: b }) => {
        const aclient = hyprland.getClient(a.address)!;
        const bclient = hyprland.getClient(b.address)!;
        return aclient.workspace.id - bclient.workspace.id;
    });
}

const taskbarBox = Widget.Box({
    className: Utils.merge(
        [options.theme.bar.buttons.style.bind('value'), options.bar.windowtitle.label.bind('value')],
        (style) => {
            const styleMap = {
                default: 'style1',
                split: 'style2',
                wave: 'style3',
                wave2: 'style3',
            };
            return `taskbar-box-container ${styleMap[style]}`;
        },
    ),
    children: sortItems(hyprland.clients.map((c) => AppItem(c.address))),
    setup: (w) => {
        w.hook(
            hyprland,
            (w, address?: string) => {
                if (typeof address === 'string')
                    w.children = w.children.filter((ch) => ch.attribute.address !== address);
            },
            'client-removed',
        )
            .hook(
                hyprland,
                (w, address?: string) => {
                    if (typeof address === 'string')
                        try {
                            w.children = sortItems([...w.children, AppItem(address)]);
                        } catch (e) {
                            print(e);
                            setTimeout(() => {
                                // 有的窗口要过一会才能正常拿到信息
                                w.children = sortItems(hyprland.clients.map((c) => AppItem(c.address)));
                            }, 3000);
                        }
                },
                'client-added',
            )
            .hook(
                hyprland,
                (w, event?: string) => {
                    if (event === 'movewindow') w.children = sortItems(w.children);
                },
                'event',
            );
        // 设置每隔10000毫秒执行一次
        setInterval(() => {
            const currentClientAddressList = w.children.map((c) => c.attribute.address);
            // print("current client class: " + currentClientAddressList);
            const newClientList = hyprland.clients.filter((c) => !currentClientAddressList.includes(c.address));
            // print("new client" + newClientList);
            if (newClientList.length > 0) {
                // print("reset");
                w.children = sortItems(hyprland.clients.map((c) => AppItem(c.address)));
            }
        }, 10000);
        // 如果你想要停止这个重复执行，可以这样做：
        // const intervalId = setInterval(()=>{});
        // clearInterval(intervalId);
    },
});

const TaskBar = (): BarBoxChild => {
    return {
        component: taskbarBox,
        isVisible: true,
        boxClass: 'taskbar',
        props: {
            on_secondary_click: (): void => {
                taskbarBox.children = sortItems(hyprland.clients.map((c) => AppItem(c.address)));
            },
        },
    };
};

export { TaskBar };
