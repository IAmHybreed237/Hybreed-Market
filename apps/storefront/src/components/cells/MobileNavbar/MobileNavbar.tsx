'use client';

import { useState } from 'react';

import { HttpTypes } from '@medusajs/types';

import { IconButton } from '@/components/atoms';
import { HeaderCategoryNavbar } from '@/components/molecules';
import { CloseIcon, HamburgerMenuIcon } from '@/icons';

import { MobileCategoryNavbar } from './components';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export const MobileNavbar = ({
  categories,
  parentCategories
}: {
  categories: HttpTypes.StoreProductCategory[];
  parentCategories: HttpTypes.StoreProductCategory[];
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenuHandler = () => {
    setIsOpen(false);
  };

  useBodyScrollLock(isOpen);

  return (
    <div
      className="lg:hidden"
      data-testid="mobile-navbar"
    >
      <div
        onClick={() => setIsOpen(true)}
        data-testid="mobile-menu-toggle"
      >
        <HamburgerMenuIcon />
      </div>
      {isOpen && (
        <div
          className="fixed left-0 top-0 z-20 h-full w-full bg-primary"
          data-testid="mobile-menu-drawer"
        >
          <div
            className="flex items-center justify-between border-b p-4"
            data-testid="mobile-menu-header"
          >
            <h2 className="heading-md uppercase text-primary">Menu</h2>
            <IconButton
              icon={<CloseIcon size={20} />}
              onClick={() => closeMenuHandler()}
              variant="icon"
              size="small"
              data-testid="mobile-menu-close-button"
            />
          </div>
          <div className="">
            <HeaderCategoryNavbar
              onClose={closeMenuHandler}
              categories={categories}
              parentCategories={parentCategories}
            />
            <div className="p-4">
              <MobileCategoryNavbar
                onClose={closeMenuHandler}
                categories={categories}
                parentCategories={parentCategories}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
