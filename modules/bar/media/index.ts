import Gdk from 'gi://Gdk?version=3.0';
const mpris = await Service.import('mpris');
import { openMenu } from '../utils.js';
import options from 'options';
import { getCurrentPlayer } from 'lib/shared/media.js';
import { BarBoxChild } from 'lib/types/bar.js';
import Button from 'types/widgets/button.js';
import { Attribute, Child } from 'lib/types/widget.js';
import { runAsyncCommand } from 'customModules/utils.js';

const { show_artist, truncation, truncation_size, show_label, show_active_only, preferred, rightClick, middleClick } =
    options.bar.media;

const Media = (): BarBoxChild => {
    const activePlayer = Variable(mpris.getPlayer(preferred.value) || mpris.players[0]);
    const isVis = Variable(!show_active_only.value);

    show_active_only.connect('changed', () => {
        isVis.value = !show_active_only.value || mpris.players.length > 0;
    });

    const changedFunc = () => {
        const curPlayer = getCurrentPlayer(activePlayer.value);
        activePlayer.value = curPlayer;
        isVis.value = !show_active_only.value || mpris.players.length > 0;
    };

    mpris.connect('changed', changedFunc);

    const getIconForPlayer = (playerName: string): string => {
        const windowTitleMap = [
            ['Firefox', '󰈹'],
            ['Chrome', '󰊯'],
            ['Microsoft Edge', '󰇩'],
            ['Discord', ''],
            ['Plex', '󰚺'],
            ['Spotify', '󰓇'],
            ['MPD(.*)', '󰝚'],
        ];

        const foundMatch = windowTitleMap.find((wt) => RegExp(wt[0], 'i').test(playerName));

        if (foundMatch) {
            return foundMatch[1];
        } else {
            console.log(`not found icon for player ${playerName}`);
            return '󰝚';
        }
    };

    const songIcon = Variable('');
    const songTitle = Variable('');

    const updateLabelFunc = () => {
        if (activePlayer.value && show_label.value) {
            const { track_title, identity, track_artists } = activePlayer.value;
            songIcon.value = getIconForPlayer(identity);
            const trackArtist = show_artist.value ? ` - ${track_artists.join(', ')}` : ``;
            const truncatedLabel = truncation.value
                ? `${track_title + trackArtist}`.substring(0, truncation_size.value)
                : `${track_title + trackArtist}`;

            const v =
                track_title.length === 0
                    ? ``
                    : truncatedLabel.length < truncation_size.value || !truncation.value
                      ? `${truncatedLabel}`
                      : `${truncatedLabel.substring(0, truncatedLabel.length - 3)}...`;
            songTitle.value = v;
            return v;
        } else {
            songIcon.value = getIconForPlayer(activePlayer.value?.identity || '');
            songTitle.value = 'No media playing...';
            return ``;
        }
    };

    Utils.watch('', [mpris, show_artist, truncation, truncation_size, show_label], updateLabelFunc);

    const label = Widget.Label({
        class_name: 'bar-button-icon media txt-icon bar',
        label: songIcon.bind('value').as((v) => v || '󰝚'),
    });

    const revealer = Widget.Revealer({
        click_through: true,
        visible: true,
        transition: 'slide_right',
        setup: (self) => {
            let current = '';
            self.hook(activePlayer, () => {
                updateLabelFunc();
                if (current === activePlayer.value.track_title) return;

                current = activePlayer.value.track_title;
                self.reveal_child = true;
                Utils.timeout(3000, () => {
                    !self.is_destroyed && (self.reveal_child = false);
                });
            });
        },
        child: Widget.Label({
            class_name: 'bar-button-label media',
            label: songTitle.bind('value').as((v) => v || 'No media playing...'),
        }),
    });

    return {
        component: Widget.Box({
            visible: false,
            child: Widget.Box({
                className: Utils.merge(
                    [options.theme.bar.buttons.style.bind('value'), show_label.bind('value')],
                    (style) => {
                        const styleMap = {
                            default: 'style1',
                            split: 'style2',
                            wave: 'style3',
                            wave2: 'style3',
                        };
                        return `media-container ${styleMap[style]}`;
                    },
                ),
                child: Widget.Box({
                    children: [label, revealer],
                }),
            }),
        }),
        isVis,
        boxClass: 'media',
        props: {
            on_hover: () => {
                revealer.reveal_child = true;
            },
            on_hover_lost: () => {
                revealer.reveal_child = false;
            },
            on_scroll_up: () => activePlayer.value?.next(),
            on_scroll_down: () => activePlayer.value?.previous(),
            on_primary_click: (clicked: Button<Child, Attribute>, event: Gdk.Event): void => {
                openMenu(clicked, event, 'mediamenu');
            },
            onSecondaryClick: (clicked: Button<Child, Attribute>, event: Gdk.Event): void => {
                runAsyncCommand(rightClick.value, { clicked, event });
            },
            onMiddleClick: (clicked: Button<Child, Attribute>, event: Gdk.Event): void => {
                runAsyncCommand(middleClick.value, { clicked, event });
            },
        },
    };
};

export { Media };
