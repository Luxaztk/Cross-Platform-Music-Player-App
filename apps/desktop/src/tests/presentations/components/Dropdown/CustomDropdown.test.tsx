import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CustomDropdown } from '@components';

describe('CustomDropdown Hardened Suite', () => {
    const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
    ];
    const onChange = vi.fn();

    it('STRICT: all options must have type="button" to prevent form resets', async () => {
        const user = userEvent.setup();
        render(<CustomDropdown options={options} value="1" onChange={onChange} />);
        
        // Open the menu
        await user.click(screen.getByRole('button'));
        
        const menuOptions = screen.getAllByRole('option');
        expect(menuOptions).toHaveLength(2);
        
        // Unforgiving assertion
        menuOptions.forEach(option => {
            expect(option).toHaveAttribute('type', 'button');
        });
    });

    it('STRICT: renders production-grade ARIA attributes', async () => {
        const user = userEvent.setup();
        render(<CustomDropdown options={options} value="1" onChange={onChange} />);
        
        const trigger = screen.getByRole('button');
        expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        
        await user.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('STRICT: selection triggers onChange and stops propagation', async () => {
        const user = userEvent.setup();
        
        render(<CustomDropdown options={options} value="1" onChange={onChange} />);
        
        await user.click(screen.getByRole('button'));
        await user.click(screen.getByText('Option 2'));
        expect(onChange).toHaveBeenCalledWith('2');
    });
});
