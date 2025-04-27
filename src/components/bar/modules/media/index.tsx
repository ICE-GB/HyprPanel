import { openMenu } from '../../utils/menu.js';
import options from 'src/options.js';
import { runAsyncCommand, throttledScrollHandler } from 'src/components/bar/utils/helpers.js';
import { generateMediaLabel } from './helpers/index.js';
import {
    onMiddleClick,
    onPrimaryClick,
    onScroll,
    onSecondaryClick,
    onHover,
    onHoverLost,
} from 'src/lib/shared/eventHandlers.js';
import { bind, timeout, Variable } from 'astal';
import { Astal } from 'astal/gtk3';
import { activePlayer, mediaAlbum, mediaArtist, mediaTitle } from 'src/shared/media.js';
import AstalMpris from 'gi://AstalMpris?version=0.1';
import { BarBoxChild } from 'src/lib/types/bar.types.js';
import { RevealerTransitionMap } from 'src/lib/constants/options.ts';

const mprisService = AstalMpris.get_default();
const {
    truncation,
    truncation_size,
    show_label,
    show_active_only,
    rightClick,
    middleClick,
    scrollUp,
    scrollDown,
    format,
} = options.bar.media;

const isVis = Variable(!show_active_only.get());

Variable.derive([bind(show_active_only), bind(mprisService, 'players')], (showActive, players) => {
    activePlayer.set(players[0]);
    isVis.set(!showActive || players?.length > 0);
});

const Media = (): BarBoxChild => {
    activePlayer.set(mprisService.get_players()[0]);

    const songIcon = Variable('');

    const mediaLabel = Variable.derive(
        [
            bind(activePlayer),
            bind(truncation),
            bind(truncation_size),
            bind(show_label),
            bind(format),
            bind(mediaTitle),
            bind(mediaAlbum),
            bind(mediaArtist),
        ],
        () => {
            return generateMediaLabel(truncation_size, show_label, format, songIcon, activePlayer);
        },
    );

    const componentClassName = Variable.derive(
        [options.theme.bar.buttons.style, show_label],
        (style: string) => {
            const styleMap: Record<string, string> = {
                default: 'style1',
                split: 'style2',
                wave: 'style3',
                wave2: 'style3',
            };
            return `media-container ${styleMap[style]}`;
        },
    );

    const hoverStatus = Variable(false);

    const component = (
        <box
            className={componentClassName()}
            onDestroy={() => {
                songIcon.drop();
                mediaLabel.drop();
                componentClassName.drop();
                hoverStatus.drop();
            }}
        >
            <label
                className={'bar-button-icon media txt-icon bar'}
                label={bind(songIcon).as((icn) => icn || '󰝚')}
            />
            <revealer
                clickThrough={true}
                visible={true}
                transitionType={RevealerTransitionMap.slide_right}
                revealChild={hoverStatus()}
                setup={(self) => {
                    self.hook(mediaLabel, () => {
                        // 显示子元素
                        self.set_reveal_child(true);

                        // 3 秒后自动隐藏（如果仍然可见）
                        timeout(3000, () => {
                            if (self.is_visible()) {
                                self.set_reveal_child(false);
                            }
                        });
                    });
                }}
            >
                <label className={'bar-button-label media'} label={mediaLabel()} />
            </revealer>
        </box>
    );

    return {
        component,
        isVis: bind(isVis),
        boxClass: 'media',
        props: {
            setup: (self: Astal.Button): void => {
                let disconnectFunctions: (() => void)[] = [];

                Variable.derive(
                    [
                        bind(rightClick),
                        bind(middleClick),
                        bind(scrollUp),
                        bind(scrollDown),
                        bind(options.bar.scrollSpeed),
                    ],
                    () => {
                        disconnectFunctions.forEach((disconnect) => disconnect());
                        disconnectFunctions = [];

                        const throttledHandler = throttledScrollHandler(options.bar.scrollSpeed.get());

                        disconnectFunctions.push(
                            onPrimaryClick(self, (clicked, event) => {
                                openMenu(clicked, event, 'mediamenu');
                            }),
                        );

                        disconnectFunctions.push(
                            onSecondaryClick(self, (clicked, event) => {
                                runAsyncCommand(rightClick.get(), { clicked, event });
                            }),
                        );

                        disconnectFunctions.push(
                            onMiddleClick(self, (clicked, event) => {
                                runAsyncCommand(middleClick.get(), { clicked, event });
                            }),
                        );

                        disconnectFunctions.push(
                            onScroll(self, throttledHandler, scrollUp.get(), scrollDown.get()),
                        );

                        disconnectFunctions.push(onHover(self, () => hoverStatus.set(true)));
                        disconnectFunctions.push(onHoverLost(self, () => hoverStatus.set(false)));
                    },
                );
            },
        },
    };
};

export { Media };
