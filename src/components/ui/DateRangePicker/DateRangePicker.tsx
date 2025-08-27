import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { IoCalendar, IoClose } from 'react-icons/io5';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './DateRangePicker.module.css';

interface DateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onDateChange: (startDate: Date | null, endDate: Date | null) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  placeholder = 'Selecionar período',
  label,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClearDates = () => {
    onDateChange(null, null);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) {return '';}
    if (startDate && !endDate) {
      return `A partir de ${startDate.toLocaleDateString('pt-BR')}`;
    }
    if (!startDate && endDate) {
      return `Até ${endDate.toLocaleDateString('pt-BR')}`;
    }
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
    }
    return '';
  };

  const hasSelection = startDate || endDate;

  return (
    <div className={`${styles.dateRangeContainer} ${className || ''}`}>
      {label && <label className={styles.label}>{label}</label>}
      
      <div className={styles.inputContainer}>
        <button
          type="button"
          className={`${styles.dateButton} ${hasSelection ? styles.hasSelection : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <IoCalendar size={16} className={styles.icon} />
          <span className={styles.dateText}>
            {hasSelection ? formatDateRange() : placeholder}
          </span>
          {hasSelection && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={(e) => {
                e.stopPropagation();
                handleClearDates();
              }}
            >
              <IoClose size={14} />
            </button>
          )}
        </button>

        {isOpen && (
          <div className={styles.pickerContainer}>
            <div className={styles.pickerWrapper}>
              <DatePicker
                selected={startDate}
                onChange={(dates) => {
                  if (Array.isArray(dates)) {
                    const [start, end] = dates;
                    onDateChange(start, end);
                    if (start && end) {
                      setIsOpen(false);
                    }
                  } else {
                    onDateChange(dates, endDate || null);
                  }
                }}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                inline
                monthsShown={2}
                dateFormat="dd/MM/yyyy"
                locale="pt-BR"
                maxDate={new Date()}
                showYearDropdown
                dropdownMode="select"
              />
              <div className={styles.pickerActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.clearAllButton}
                  onClick={handleClearDates}
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};