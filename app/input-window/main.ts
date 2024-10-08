import Gtk from 'gi://Gtk?version=3.0';
import Entry from 'types/widgets/entry';

let value: string | null;

const copyTo = (value: string | null): void => {
    if (value == null) {
        return;
    }
    Utils.execAsync(`wl-copy ${value}`)
        .then((out) => print(out))
        .catch((err) => print(err));
};

const InputWindowEntry = (): Entry<unknown> => {
    const entry = Widget.Entry({
        placeholder_text: 'Input...',
        on_change: ({ text }) => {
            value = text;
        },
        onAccept: ({ text }) => {
            print(text);
            copyTo(text);
        },
    });
    return entry;
};

const InputWindow = (): Gtk.Window => {
    const name = 'input-window';
    const win = new Gtk.Window({
        name: name,
        title: name,
        child: InputWindowEntry(),
    });

    win.show_all();
    win.connect('delete-event', () => {
        copyTo(value);
        App.quit();
        return true;
    });
    return win;
};

export default { windows: [InputWindow()] };
