import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChatBubbleLeftIcon } from '@heroicons/react/20/solid';

interface DropdownMenuProps {
  items: any[];
}

const DropdownMenu: any = ({ items }: DropdownMenuProps) => {
  return (
    <Menu as="div" className="relative inline-block text-right">
      <div>
        <MenuButton className="inline-flex justify-center">
          <ChatBubbleLeftIcon aria-hidden="true" className="w-5 h-5 shrink-0 right-2 pr-1" />
        </MenuButton>
      </div>

      <MenuItems
        transition
        className="absolute right-0 z-10 w-56 origin-top-right divide-gray-100 rounded-md bg-white ring-1 shadow-lg ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
      >
        {items.map((item, index) => (
          <MenuItem key={index}>
            <button
              onClick={item.onClick}
              className="block w-full px-0.5 py-0.5 text-right text-base text-gray-900 bg-white hover:bg-gray-100 data-focus:outline-hidden"
            >
              {item.label}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
};

export default DropdownMenu;
